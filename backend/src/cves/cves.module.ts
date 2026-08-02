import { Module } from '@nestjs/common';
import { CvesController } from './cves.controller';
import { CvesService } from './cves.service';

@Module({
  controllers: [CvesController],
  providers: [CvesService],
  exports: [CvesService],
})
export class CvesModule {}
