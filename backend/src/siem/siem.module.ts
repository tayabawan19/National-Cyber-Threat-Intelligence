import { Module } from '@nestjs/common';
import { SiemController } from './siem.controller';
import { SiemService } from './siem.service';
import { SiemPushService } from './siem-push.service';
import { PrismaModule } from '../prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [PrismaModule, ConfigModule],
  controllers: [SiemController],
  providers: [SiemService, SiemPushService],
  exports: [SiemService, SiemPushService],
})
export class SiemModule {}
