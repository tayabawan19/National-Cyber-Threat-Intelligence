import { Module } from '@nestjs/common';
import { SiemController } from './siem.controller';
import { SiemService } from './siem.service';
import { PrismaModule } from '../prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [PrismaModule, ConfigModule],
  controllers: [SiemController],
  providers: [SiemService],
  exports: [SiemService],
})
export class SiemModule {}
