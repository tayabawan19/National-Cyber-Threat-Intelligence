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
export class OtxProcessorService {
  private readonly logger = new Logger(OtxProcessorService.name);

  constructor(
    private prisma: PrismaService,
    private openSearchService: OpenSearchService,
    private detectionEngineService: DetectionEngineService,
    private httpService: HttpService,
    private configService: ConfigService,
  ) {}

  async processOtxJob(job: Job<any, any, string>): Promise<any> {
    const { feedId } = job.data;
    this.logger.log(`Starting OTX feed ingestion job (Feed ID: ${feedId})...`);

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
      const apiKey = this.configService.get<string>('OTX_API_KEY');
      let indicators: Array<{ type: string; value: string; tags: string[]; rawPayload: any }> = [];

      if (apiKey && apiKey !== 'your_alienvault_otx_api_key_here') {
        try {
          let response = await firstValueFrom(
            this.httpService.get('https://otx.alienvault.com/api/v1/pulses/subscribed?limit=10', {
              headers: { 'X-OTX-API-KEY': apiKey },
              timeout: 10000,
            }),
          );

          httpStatus = response.status || 200;
          let pulses = response.data?.results || [];

          if (pulses.length === 0) {
            response = await firstValueFrom(
              this.httpService.get('https://otx.alienvault.com/api/v1/pulses/activity?limit=10', {
                headers: { 'X-OTX-API-KEY': apiKey },
                timeout: 10000,
              }),
            );
            pulses = response.data?.results || [];
          }

          for (const pulse of pulses) {
            const tags = pulse.tags || [];
            for (const ind of pulse.indicators || []) {
              indicators.push({
                type: ind.type,
                value: ind.indicator,
                tags,
                rawPayload: ind,
              });
            }
          }

          if (indicators.length > 0) {
            syncPathTag = 'LIVE_API_SUCCESS';
            realRecordsCount = indicators.length;
            logMessage = `LIVE_API_SUCCESS (HTTP ${httpStatus}) - Ingested ${realRecordsCount} live IOC records from AlienVault OTX API`;
            this.logger.log(`[SYNC PATH: ${syncPathTag}] ${logMessage}`);
          } else {
            syncPathTag = 'LIVE_API_FAILED_USED_FALLBACK';
            logMessage = `LIVE_API_FAILED_USED_FALLBACK (HTTP ${httpStatus}) - Live API returned 0 indicators. Ingesting fallback dataset.`;
            this.logger.warn(`[SYNC PATH: ${syncPathTag}] ${logMessage}`);
            indicators = this.getFallbackOtxData();
            fallbackRecordsCount = indicators.length;
          }
        } catch (apiErr: any) {
          httpStatus = apiErr.response?.status || 500;
          syncPathTag = 'LIVE_API_FAILED_USED_FALLBACK';
          logMessage = `LIVE_API_FAILED_USED_FALLBACK (HTTP ${httpStatus} - ${apiErr.message}) - Using fallback telemetry.`;
          this.logger.warn(`[SYNC PATH: ${syncPathTag}] ${logMessage}`);
          indicators = this.getFallbackOtxData();
          fallbackRecordsCount = indicators.length;
        }
      } else {
        syncPathTag = 'LIVE_API_FAILED_USED_FALLBACK';
        logMessage = `LIVE_API_FAILED_USED_FALLBACK (No OTX_API_KEY configured) - Ingesting demonstration telemetry data.`;
        this.logger.log(`[SYNC PATH: ${syncPathTag}] ${logMessage}`);
        indicators = this.getFallbackOtxData();
        fallbackRecordsCount = indicators.length;
      }

      for (const item of indicators) {
        const iocType = this.mapOtxTypeToIocType(item.type);
        const savedIoc = await this.prisma.ioc.upsert({
          where: { value: item.value },
          update: {
            source: 'AlienVault OTX',
            lastSeen: new Date(),
            tags: item.tags,
            rawPayload: item.rawPayload,
          },
          create: {
            value: item.value,
            type: iocType,
            source: 'AlienVault OTX',
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
      this.logger.error(`OTX feed ingestion failed: ${error.message}`, error.stack);
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

  private mapOtxTypeToIocType(otxType: string): IocType {
    const t = (otxType || '').toLowerCase();
    if (t.includes('ipv4') || t.includes('ipv6') || t.includes('ip')) return IocType.IP;
    if (t.includes('domain') || t.includes('hostname')) return IocType.DOMAIN;
    if (t.includes('url') || t.includes('uri')) return IocType.URL;
    if (t.includes('hash') || t.includes('md5') || t.includes('sha')) return IocType.HASH;
    return IocType.DOMAIN;
  }

  private getFallbackOtxData() {
    return [
      {
        type: 'IPv4',
        value: '198.51.100.45',
        tags: ['botnet', 'otx-c2', 'apt29'],
        rawPayload: { description: 'Known APT29 command and control server' },
      },
      {
        type: 'domain',
        value: 'malicious-update-server.com',
        tags: ['phishing', 'otx', 'credential-stealer'],
        rawPayload: { description: 'Suspicious domain serving fake software updates' },
      },
      {
        type: 'FileHash-SHA256',
        value: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        tags: ['ransomware', 'otx-hash'],
        rawPayload: { description: 'LockBit ransomware payload sample' },
      },
      {
        type: 'URL',
        value: 'http://malware-drop-zone.net/payload.exe',
        tags: ['dropper', 'otx'],
        rawPayload: { description: 'Active malware payload URL distribution point' },
      },
    ];
  }
}
