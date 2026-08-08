import { Module, forwardRef } from '@nestjs/common';
import { PlaybooksService } from './playbooks.service';
import { PlaybooksController } from './playbooks.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { SiemModule } from '../siem/siem.module';

@Module({
  imports: [PrismaModule, forwardRef(() => SiemModule)],
  controllers: [PlaybooksController],
  providers: [PlaybooksService],
  exports: [PlaybooksService],
})
export class PlaybooksModule {}
