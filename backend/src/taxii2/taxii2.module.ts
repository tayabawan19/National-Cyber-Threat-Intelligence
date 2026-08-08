import { Module } from '@nestjs/common';
import { Taxii2Service } from './taxii2.service';
import { Taxii2Controller } from './taxii2.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [Taxii2Controller],
  providers: [Taxii2Service],
  exports: [Taxii2Service],
})
export class Taxii2Module {}
