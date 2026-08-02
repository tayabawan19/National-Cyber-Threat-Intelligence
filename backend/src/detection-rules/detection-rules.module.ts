import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { DetectionRulesService } from './detection-rules.service';
import { DetectionRulesController } from './detection-rules.controller';

@Module({
  imports: [PrismaModule],
  controllers: [DetectionRulesController],
  providers: [DetectionRulesService],
  exports: [DetectionRulesService],
})
export class DetectionRulesModule {}
