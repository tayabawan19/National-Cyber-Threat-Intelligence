import { Module } from '@nestjs/common';
import { AttackTechniquesService } from './attack-techniques.service';
import { AttackTechniquesController } from './attack-techniques.controller';

@Module({
  controllers: [AttackTechniquesController],
  providers: [AttackTechniquesService],
  exports: [AttackTechniquesService],
})
export class AttackTechniquesModule {}
