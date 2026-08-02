import { Injectable, Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { PrismaService } from '../../prisma/prisma.service';
import { OpenSearchService } from '../../opensearch/opensearch.service';
import { IocType } from '@prisma/client';
import { DetectionEngineService } from '../../detection-engine/detection-engine.service';
import { SyncPathTag } from './otx.processor';

@Injectable()
export class AbuseChProcessorService {
  private readonly logger = new Logger(AbuseChProcessorService.name);

  constructor(
    private prisma: PrismaService,
    private openSearchService: OpenSearchService,
    private detectionEngineService: DetectionEngineService,
    private httpService: HttpService,
  ) {}

  async processAbuseChJob(job: Job<any, any, string>): Promise<any> {
    const { feedId } = job.data;
    this.logger.log(`Starting abuse.ch feed ingestion job (Feed ID: ${feedId})...`);

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
      let items: Array<{ type: string; value: string; tags: string[]; rawPayload: any }> = [];

      try {
        const response = await firstValueFrom(
          this.httpService.get('https://feodotracker.abuse.ch/downloads/ipblocklist.json', {
            headers: { 'User-Agent': 'CyberIntelPlatform/1.0' },
            timeout: 10000,
          }),
        );

        httpStatus = response.status || 200;
        const rawList = Array.isArray(response.data) ? response.data.slice(0, 15) : [];

        for (const raw of rawList) {
          if (!raw.ip_address) continue;
          const ipVal = raw.port ? `${raw.ip_address}:${raw.port}` : raw.ip_address;
          items.push({
            type: 'ip:port',
            value: ipVal,
            tags: ['feodo-tracker', 'botnet', 'c2', (raw.malware || 'botnet').toLowerCase()],
            rawPayload: raw,
          });
        }

        if (items.length > 0) {
          syncPathTag = 'LIVE_API_SUCCESS';
          realRecordsCount = items.length;
          logMessage = `LIVE_API_SUCCESS (HTTP ${httpStatus}) - Ingested ${realRecordsCount} live C2 IP records from abuse.ch Feodo Tracker API`;
          this.logger.log(`[SYNC PATH: ${syncPathTag}] ${logMessage}`);
        } else {
          syncPathTag = 'LIVE_API_FAILED_USED_FALLBACK';
          logMessage = `LIVE_API_FAILED_USED_FALLBACK (HTTP ${httpStatus}) - Live API returned 0 records. Using fallback dataset.`;
          this.logger.warn(`[SYNC PATH: ${syncPathTag}] ${logMessage}`);
          items = this.getFallbackAbuseChData();
          fallbackRecordsCount = items.length;
        }
      } catch (apiErr: any) {
        httpStatus = apiErr.response?.status || 500;
        syncPathTag = 'LIVE_API_FAILED_USED_FALLBACK';
        logMessage = `LIVE_API_FAILED_USED_FALLBACK (HTTP ${httpStatus} - ${apiErr.message}) - Using fallback dataset.`;
        this.logger.warn(`[SYNC PATH: ${syncPathTag}] ${logMessage}`);
        items = this.getFallbackAbuseChData();
        fallbackRecordsCount = items.length;
      }

      for (const item of items) {
        const iocType = this.mapAbuseChTypeToIocType(item.type, item.value);
        const savedIoc = await this.prisma.ioc.upsert({
          where: { value: item.value },
          update: {
            source: 'abuse.ch',
            lastSeen: new Date(),
            tags: item.tags,
            rawPayload: item.rawPayload,
          },
          create: {
            value: item.value,
            type: iocType,
            source: 'abuse.ch',
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
      this.logger.error(`abuse.ch feed ingestion failed: ${error.message}`, error.stack);
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

  private mapAbuseChTypeToIocType(iocType: string, value: string): IocType {
    const t = (iocType || '').toLowerCase();
    if (t.includes('ip') || t.includes('ip:port')) return IocType.IP;
    if (t.includes('domain') || t.includes('hostname')) return IocType.DOMAIN;
    if (t.includes('url')) return IocType.URL;
    if (t.includes('hash') || t.includes('md5') || t.includes('sha256')) return IocType.HASH;

    if (value.startsWith('http://') || value.startsWith('https://')) return IocType.URL;
    if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/.test(value)) return IocType.IP;

    return IocType.DOMAIN;
  }

  private getFallbackAbuseChData() {
    return [
      {
        type: 'ip:port',
        value: '185.220.101.5:8080',
        tags: ['botnet', 'feodo-tracker', 'c2'],
        rawPayload: { malware: 'Qakbot', confidence: 100 },
      },
      {
        type: 'domain',
        value: 'secure-banking-verify-login.xyz',
        tags: ['urlhaus', 'phishing', 'banking-trojan'],
        rawPayload: { reporter: 'abuse_ch_community' },
      },
      {
        type: 'sha256_hash',
        value: '2c26b46b68ffc68ff99b453c1d30413413422d706483bfa0f98a5e886266e7ae',
        tags: ['threatfox', 'agenttesla', 'keylogger'],
        rawPayload: { family: 'AgentTesla' },
      },
      {
        type: 'url',
        value: 'http://compromised-site.org/images/invoice.pdf.exe',
        tags: ['urlhaus', 'dropper'],
        rawPayload: { threat: 'Emotet' },
      },
    ];
  }
}
