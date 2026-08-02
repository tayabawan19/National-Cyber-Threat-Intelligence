import { Injectable, Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { PrismaService } from '../../prisma/prisma.service';
import { OpenSearchService } from '../../opensearch/opensearch.service';
import { DetectionEngineService } from '../../detection-engine/detection-engine.service';
import { SyncPathTag } from './otx.processor';

@Injectable()
export class NvdProcessorService {
  private readonly logger = new Logger(NvdProcessorService.name);

  constructor(
    private prisma: PrismaService,
    private openSearchService: OpenSearchService,
    private detectionEngineService: DetectionEngineService,
    private httpService: HttpService,
    private configService: ConfigService,
  ) {}

  async processNvdJob(job: Job<any, any, string>): Promise<any> {
    const { feedId } = job.data;
    this.logger.log(`Starting NVD CVE ingestion job (Feed ID: ${feedId})...`);

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
      const apiKey = this.configService.get<string>('NVD_API_KEY');
      let cves: Array<{
        cveId: string;
        description: string;
        cvssScore: number | null;
        publishedDate: Date | null;
        lastModifiedDate: Date | null;
        rawPayload: any;
      }> = [];

      try {
        const headers: Record<string, string> = {
          'User-Agent': 'CyberIntelPlatform/1.0',
        };
        if (apiKey && apiKey !== 'your_nvd_nist_api_key_here') {
          headers['apiKey'] = apiKey;
        }

        const response = await firstValueFrom(
          this.httpService.get('https://services.nvd.nist.gov/rest/json/cves/2.0?resultsPerPage=15', {
            headers,
            timeout: 12000,
          }),
        );

        httpStatus = response.status || 200;
        const vulnerabilities = response.data?.vulnerabilities || [];
        for (const item of vulnerabilities) {
          const cveObj = item.cve;
          if (!cveObj?.id) continue;

          const descriptions = cveObj.descriptions || [];
          const engDesc = descriptions.find((d: any) => d.lang === 'en')?.value || descriptions[0]?.value || '';

          let cvssScore: number | null = null;
          const metrics = cveObj.metrics || {};
          if (metrics.cvssMetricV31?.[0]?.cvssData?.baseScore) {
            cvssScore = metrics.cvssMetricV31[0].cvssData.baseScore;
          } else if (metrics.cvssMetricV30?.[0]?.cvssData?.baseScore) {
            cvssScore = metrics.cvssMetricV30[0].cvssData.baseScore;
          } else if (metrics.cvssMetricV2?.[0]?.cvssData?.baseScore) {
            cvssScore = metrics.cvssMetricV2[0].cvssData.baseScore;
          }

          cves.push({
            cveId: cveObj.id,
            description: engDesc,
            cvssScore,
            publishedDate: cveObj.published ? new Date(cveObj.published) : null,
            lastModifiedDate: cveObj.lastModified ? new Date(cveObj.lastModified) : null,
            rawPayload: cveObj,
          });
        }

        if (cves.length > 0) {
          syncPathTag = 'LIVE_API_SUCCESS';
          realRecordsCount = cves.length;
          logMessage = `LIVE_API_SUCCESS (HTTP ${httpStatus}) - Ingested ${realRecordsCount} live CVE records from NVD NIST API`;
          this.logger.log(`[SYNC PATH: ${syncPathTag}] ${logMessage}`);
        } else {
          syncPathTag = 'LIVE_API_FAILED_USED_FALLBACK';
          logMessage = `LIVE_API_FAILED_USED_FALLBACK (HTTP ${httpStatus}) - Live API returned 0 CVEs. Using fallback dataset.`;
          this.logger.warn(`[SYNC PATH: ${syncPathTag}] ${logMessage}`);
          cves = this.getFallbackNvdData();
          fallbackRecordsCount = cves.length;
        }
      } catch (apiErr: any) {
        httpStatus = apiErr.response?.status || 500;
        syncPathTag = 'LIVE_API_FAILED_USED_FALLBACK';
        logMessage = `LIVE_API_FAILED_USED_FALLBACK (HTTP ${httpStatus} - ${apiErr.message}) - Using fallback CVE dataset.`;
        this.logger.warn(`[SYNC PATH: ${syncPathTag}] ${logMessage}`);
        cves = this.getFallbackNvdData();
        fallbackRecordsCount = cves.length;
      }

      for (const cveItem of cves) {
        const savedCve = await this.prisma.cve.upsert({
          where: { cveId: cveItem.cveId },
          update: {
            description: cveItem.description,
            cvssScore: cveItem.cvssScore,
            publishedDate: cveItem.publishedDate,
            lastModifiedDate: cveItem.lastModifiedDate,
            source: 'NVD',
            rawPayload: cveItem.rawPayload,
          },
          create: {
            cveId: cveItem.cveId,
            description: cveItem.description,
            cvssScore: cveItem.cvssScore,
            publishedDate: cveItem.publishedDate,
            lastModifiedDate: cveItem.lastModifiedDate,
            source: 'NVD',
            rawPayload: cveItem.rawPayload,
          },
        });

        await this.openSearchService.indexCve(savedCve);
        await this.detectionEngineService.evaluateCve(savedCve.id);
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
      this.logger.error(`NVD feed ingestion failed: ${error.message}`, error.stack);
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

  private getFallbackNvdData() {
    return [
      {
        cveId: 'CVE-2024-21626',
        description: 'runC container breakout vulnerability allowing privilege escalation to root host access.',
        cvssScore: 8.6,
        publishedDate: new Date('2024-01-31'),
        lastModifiedDate: new Date('2024-02-05'),
        rawPayload: { severity: 'HIGH', category: 'CONTAINER' },
      },
      {
        cveId: 'CVE-2024-3094',
        description: 'Malicious code injection in XZ Utils compression library versions 5.6.0 and 5.6.1.',
        cvssScore: 10.0,
        publishedDate: new Date('2024-03-29'),
        lastModifiedDate: new Date('2024-04-01'),
        rawPayload: { severity: 'CRITICAL', category: 'SUPPLY_CHAIN' },
      },
    ];
  }
}
