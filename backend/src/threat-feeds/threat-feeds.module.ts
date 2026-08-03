import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { ThreatFeedsController } from './threat-feeds.controller';
import { ThreatFeedsService, THREAT_INGESTION_QUEUE } from './threat-feeds.service';
import { ThreatIngestionProcessor } from './processors/threat-ingestion.processor';
import { OtxProcessorService } from './processors/otx.processor';
import { NvdProcessorService } from './processors/nvd.processor';
import { AbuseChProcessorService } from './processors/abusech.processor';
import { MalwareProcessorService } from './processors/malware.processor';
import { MispProcessorService } from './processors/misp.processor';
import { DetectionEngineModule } from '../detection-engine/detection-engine.module';

@Module({
  imports: [
    HttpModule,
    ConfigModule,
    DetectionEngineModule,
    BullModule.registerQueue({
      name: THREAT_INGESTION_QUEUE,
    }),
  ],
  controllers: [ThreatFeedsController],
  providers: [
    ThreatFeedsService,
    ThreatIngestionProcessor,
    OtxProcessorService,
    NvdProcessorService,
    AbuseChProcessorService,
    MalwareProcessorService,
    MispProcessorService,
  ],
  exports: [ThreatFeedsService],
})
export class ThreatFeedsModule {}
