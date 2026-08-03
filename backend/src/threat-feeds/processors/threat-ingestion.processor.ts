import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { THREAT_INGESTION_QUEUE } from '../threat-feeds.service';
import { OtxProcessorService } from './otx.processor';
import { NvdProcessorService } from './nvd.processor';
import { AbuseChProcessorService } from './abusech.processor';
import { MalwareProcessorService } from './malware.processor';
import { MispProcessorService } from './misp.processor';

@Processor(THREAT_INGESTION_QUEUE)
export class ThreatIngestionProcessor extends WorkerHost {
  private readonly logger = new Logger(ThreatIngestionProcessor.name);

  constructor(
    private otxProcessor: OtxProcessorService,
    private nvdProcessor: NvdProcessorService,
    private abuseChProcessor: AbuseChProcessorService,
    private malwareProcessor: MalwareProcessorService,
    private mispProcessor: MispProcessorService,
  ) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    this.logger.log(`Received queue job '${job.name}' (Job ID: ${job.id})`);

    if (job.name === 'sync-otx') {
      return this.otxProcessor.processOtxJob(job);
    }

    if (job.name === 'sync-nvd') {
      return this.nvdProcessor.processNvdJob(job);
    }

    if (job.name === 'sync-abusech') {
      return this.abuseChProcessor.processAbuseChJob(job);
    }

    if (job.name === 'sync-malware') {
      return this.malwareProcessor.processMalwareJob(job);
    }

    if (job.name === 'sync-misp') {
      return this.mispProcessor.processMispJob(job);
    }

    this.logger.warn(`Unknown job name '${job.name}' passed to ThreatIngestionProcessor`);
    return { status: 'UNKNOWN_JOB_NAME' };
  }
}
