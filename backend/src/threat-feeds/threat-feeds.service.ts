import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { OpenSearchService } from '../opensearch/opensearch.service';

export const THREAT_INGESTION_QUEUE = 'threat-ingestion';

@Injectable()
export class ThreatFeedsService {
  private readonly logger = new Logger(ThreatFeedsService.name);

  constructor(
    private prisma: PrismaService,
    private openSearchService: OpenSearchService,
    @InjectQueue(THREAT_INGESTION_QUEUE) private readonly ingestionQueue: Queue,
  ) {}

  async findAll() {
    return this.prisma.threatFeed.findMany({
      include: {
        syncLogs: {
          take: 5,
          orderBy: { startedAt: 'desc' },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const feed = await this.prisma.threatFeed.findUnique({
      where: { id },
      include: {
        syncLogs: {
          take: 10,
          orderBy: { startedAt: 'desc' },
        },
      },
    });

    if (!feed) {
      throw new NotFoundException(`Threat feed with ID '${id}' not found`);
    }

    return feed;
  }

  async triggerSync(feedId: string) {
    const feed = await this.findOne(feedId);

    if (!feed.enabled) {
      throw new Error(`Feed '${feed.name}' is currently disabled.`);
    }

    let jobName = '';
    const nameLower = feed.name.toLowerCase();

    if (nameLower.includes('malware') || nameLower.includes('bazaar')) {
      jobName = 'sync-malware';
    } else if (nameLower.includes('otx') || nameLower.includes('alienvault')) {
      jobName = 'sync-otx';
    } else if (nameLower.includes('nvd') || nameLower.includes('cve')) {
      jobName = 'sync-nvd';
    } else if (nameLower.includes('abuse')) {
      jobName = 'sync-abusech';
    } else {
      throw new Error(`Unknown feed sync worker for feed '${feed.name}'`);
    }

    const job = await this.ingestionQueue.add(
      jobName,
      { feedId: feed.id, feedName: feed.name },
      { removeOnComplete: true, attempts: 3, backoff: { type: 'exponential', delay: 5000 } },
    );

    this.logger.log(`Enqueued manual sync job #${job.id} for feed '${feed.name}'`);

    return {
      message: `Sync job enqueued successfully for feed '${feed.name}'`,
      jobId: job.id,
      feedId: feed.id,
      status: 'ENQUEUED',
    };
  }

  async reindexSearchMirror() {
    this.logger.log('Starting full reindex of OpenSearch indices from PostgreSQL...');
    const iocs = await this.prisma.ioc.findMany();
    const cves = await this.prisma.cve.findMany();

    const result = await this.openSearchService.reindexAll(iocs, cves);
    return {
      message: 'OpenSearch search indices successfully rebuilt from PostgreSQL source of truth',
      ...result,
    };
  }
}
