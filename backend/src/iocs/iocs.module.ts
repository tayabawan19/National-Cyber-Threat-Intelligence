import { Module } from '@nestjs/common';
import { IocsService } from './iocs.service';
import { IocsController } from './iocs.controller';

@Module({
  controllers: [IocsController],
  providers: [IocsService],
  exports: [IocsService],
})
export class IocsModule {}
