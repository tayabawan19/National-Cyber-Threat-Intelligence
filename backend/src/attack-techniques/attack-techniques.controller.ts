import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { AttackTechniquesService } from './attack-techniques.service';

@ApiTags('attack-techniques')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('attack-techniques')
export class AttackTechniquesController {
  constructor(private readonly attackTechniquesService: AttackTechniquesService) {}

  @Get()
  @ApiOperation({ summary: 'List all reference MITRE ATT&CK techniques' })
  findAll() {
    return this.attackTechniquesService.findAll();
  }

  @Get('matrix')
  @ApiOperation({ summary: 'Get MITRE ATT&CK Heatmap Matrix grouped by tactic with observed alert counts' })
  getMatrix() {
    return this.attackTechniquesService.getMatrix();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get specific MITRE ATT&CK technique details' })
  findOne(@Param('id') id: string) {
    return this.attackTechniquesService.findOne(id);
  }
}
