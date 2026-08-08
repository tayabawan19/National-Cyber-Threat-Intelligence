import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { LlmModule } from '../llm/llm.module';
import { DetectionEngineService } from './detection-engine.service';
import { PlaybooksModule } from '../playbooks/playbooks.module';
import { SiemModule } from '../siem/siem.module';
import { EmailAlertService } from '../common/email-alert.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [PrismaModule, LlmModule, PlaybooksModule, SiemModule, ConfigModule],
  providers: [DetectionEngineService, EmailAlertService],
  exports: [DetectionEngineService, EmailAlertService],
})
export class DetectionEngineModule {}
