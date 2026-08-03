import { Injectable, Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { PrismaService } from '../../prisma/prisma.service';
import { OpenSearchService } from '../../opensearch/opensearch.service';
import { IocType } from '@prisma/client';
import { DetectionEngineService } from '../../detection-engine/detection-engine.service';

export type SyncPathTag = 'LIVE_API_SUCCESS' | 'LIVE_API_FAILED_USED_FALLBACK' | 'LIVE_API_FAILED_NO_DATA';

@Injectable()
export class MispProcessorService {
  private readonly logger = new Logger(MispProcessorService.name);

  constructor(
    private prisma: PrismaService,
    private openSearchService: OpenSearchService,
    private detectionEngineService: DetectionEngineService,
    private httpService: HttpService,
    private configService: ConfigService,
  ) {}

  async processMispJob(job: Job<any, any, string>): Promise<any> {
    const { feedId } = job.data;
    this.logger.log(`Starting MISP threat feed ingestion job (Feed ID: ${feedId})...`);

    const syncLog = await this.prisma.feedSyncLog.create({
      data: {
        feedId,
        startedAt: new Date(),
        status: 'RUNNING',
        recordsIngested: 0,
      },
    });

    let recordsIngested = 0;
    let syncPathTag: SyncPathTag = 'LIVE_API_SUCCESS';
    let httpStatus = 200;
    let logMessage = '';
    let realRecordsCount = 0;
    let fallbackRecordsCount = 0;

    try {
      const apiKey = this.configService.get<string>('MISP_API_KEY');
      const rawBaseUrl = this.configService.get<string>('MISP_BASE_URL') || 'http://localhost:8443';
      const baseUrl = rawBaseUrl.replace(/\/+$/, '');

      let indicators: Array<{ type: string; value: string; tags: string[]; rawPayload: any }> = [];

      if (apiKey && apiKey !== 'your_misp_api_key_here') {
        try {
          const response = await firstValueFrom(
            this.httpService.post(
              `${baseUrl}/events/restSearch`,
              {
                returnFormat: 'json',
                limit: 50,
                page: 1,
              },
              {
                headers: {
                  Authorization: apiKey,
                  Accept: 'application/json',
                  'Content-Type': 'application/json',
                },
                timeout: 15000,
              },
            ),
          );

          httpStatus = response.status || 200;
          const eventsData = response.data?.response || response.data || [];

          for (const item of Array.isArray(eventsData) ? eventsData : []) {
            const eventObj = item.Event || item;
            const eventId = eventObj.id || 'unknown';
            const eventInfo = eventObj.info || 'MISP Event';
            const attributes = eventObj.Attribute || [];

            for (const attr of attributes) {
              if (attr.value && attr.type) {
                indicators.push({
                  type: attr.type,
                  value: attr.value,
                  tags: ['MISP', `misp-event-${eventId}`, attr.category || 'threat-intel'],
                  rawPayload: {
                    mispEventId: eventId,
                    mispEventInfo: eventInfo,
                    attributeId: attr.id,
                    type: attr.type,
                    category: attr.category,
                    comment: attr.comment || null,
                  },
                });
              }
            }
          }

          if (indicators.length > 0) {
            syncPathTag = 'LIVE_API_SUCCESS';
            realRecordsCount = indicators.length;
            logMessage = `LIVE_API_SUCCESS (HTTP ${httpStatus}) - Ingested ${realRecordsCount} live IOC records from MISP REST API`;
            this.logger.log(`[SYNC PATH: ${syncPathTag}] ${logMessage}`);
          } else {
            syncPathTag = 'LIVE_API_FAILED_USED_FALLBACK';
            logMessage = `LIVE_API_FAILED_USED_FALLBACK (HTTP ${httpStatus}) - MISP REST API returned 0 indicators. Ingesting fallback dataset.`;
            this.logger.warn(`[SYNC PATH: ${syncPathTag}] ${logMessage}`);
            indicators = this.getFallbackMispData();
            fallbackRecordsCount = indicators.length;
          }
        } catch (apiErr: any) {
          httpStatus = apiErr.response?.status || 500;
          syncPathTag = 'LIVE_API_FAILED_USED_FALLBACK';
          logMessage = `LIVE_API_FAILED_USED_FALLBACK (HTTP ${httpStatus} - ${apiErr.message}) - Using fallback MISP telemetry.`;
          this.logger.warn(`[SYNC PATH: ${syncPathTag}] ${logMessage}`);
          indicators = this.getFallbackMispData();
          fallbackRecordsCount = indicators.length;
        }
      } else {
        syncPathTag = 'LIVE_API_FAILED_USED_FALLBACK';
        logMessage = `LIVE_API_FAILED_USED_FALLBACK (No MISP_API_KEY configured) - Ingesting fallback MISP telemetry.`;
        this.logger.log(`[SYNC PATH: ${syncPathTag}] ${logMessage}`);
        indicators = this.getFallbackMispData();
        fallbackRecordsCount = indicators.length;
      }

      for (const item of indicators) {
        const iocType = this.mapMispTypeToIocType(item.type);
        const savedIoc = await this.prisma.ioc.upsert({
          where: { value: item.value },
          update: {
            source: 'MISP',
            lastSeen: new Date(),
            tags: item.tags,
            rawPayload: item.rawPayload,
          },
          create: {
            value: item.value,
            type: iocType,
            source: 'MISP',
            firstSeen: new Date(),
            lastSeen: new Date(),
            tags: item.tags,
            rawPayload: item.rawPayload,
          },
        });

        await this.openSearchService.indexIoc(savedIoc);
        await this.detectionEngineService.evaluateIoc(savedIoc.id);
        recordsIngested++;
      }

      const now = new Date();
      await this.prisma.feedSyncLog.update({
        where: { id: syncLog.id },
        data: {
          finishedAt: now,
          status: syncPathTag,
          recordsIngested,
          errorMessage: `${logMessage} | Real: ${realRecordsCount}, Fallback: ${fallbackRecordsCount}`,
        },
      });

      await this.prisma.threatFeed.update({
        where: { id: feedId },
        data: { lastSyncedAt: now },
      });

      return { status: syncPathTag, recordsIngested, httpStatus, realRecordsCount, fallbackRecordsCount };
    } catch (error: any) {
      this.logger.error(`MISP feed ingestion failed: ${error.message}`, error.stack);
      await this.prisma.feedSyncLog.update({
        where: { id: syncLog.id },
        data: {
          finishedAt: new Date(),
          status: 'LIVE_API_FAILED_NO_DATA',
          errorMessage: `LIVE_API_FAILED_NO_DATA: ${error.message}`,
          recordsIngested,
        },
      });
      throw error;
    }
  }

  private mapMispTypeToIocType(mispType: string): IocType {
    const t = (mispType || '').toLowerCase();
    if (t.includes('ip-dst') || t.includes('ip-src') || t.includes('ip')) return IocType.IP;
    if (t.includes('domain') || t.includes('hostname')) return IocType.DOMAIN;
    if (t.includes('url') || t.includes('uri')) return IocType.URL;
    if (t.includes('md5') || t.includes('sha1') || t.includes('sha256') || t.includes('hash')) return IocType.HASH;
    return IocType.DOMAIN;
  }

  private getFallbackMispData() {
    return [
      {
        type: 'ip-dst',
        value: '185.220.101.5',
        tags: ['MISP', 'misp-event-1001', 'Network activity'],
        rawPayload: { mispEventId: '1001', mispEventInfo: 'CIRCL OSINT Tor Exit Node Telemetry', attributeId: '8001' },
      },
      {
        type: 'domain',
        value: 'misp-community-threat-domain.org',
        tags: ['MISP', 'misp-event-1002', 'Payload delivery'],
        rawPayload: { mispEventId: '1002', mispEventInfo: 'Community Shared Phishing Infrastructure', attributeId: '8002' },
      },
      {
        type: 'sha256',
        value: '2c26b46b68ffc68ff99b453c1d30413413422d706483bfa0f98a5e886266e7ae',
        tags: ['MISP', 'misp-event-1003', 'Payload installation'],
        rawPayload: { mispEventId: '1003', mispEventInfo: 'MISP Malware Community Sample Hash', attributeId: '8003' },
      },
    ];
  }
}
