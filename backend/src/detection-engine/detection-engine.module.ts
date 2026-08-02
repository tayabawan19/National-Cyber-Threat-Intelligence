import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { LlmModule } from '../llm/llm.module';
import { DetectionEngineService } from './detection-engine.service';

@Module({
  imports: [PrismaModule, LlmModule],
  providers: [DetectionEngineService],
  exports: [DetectionEngineService],
})
export class DetectionEngineModule {}
