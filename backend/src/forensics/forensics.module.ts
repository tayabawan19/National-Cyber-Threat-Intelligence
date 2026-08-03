import { Module } from '@nestjs/common';
import { ForensicsController } from './forensics.controller';
import { ForensicsService } from './forensics.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ForensicsController],
  providers: [ForensicsService],
  exports: [ForensicsService],
})
export class ForensicsModule {}
