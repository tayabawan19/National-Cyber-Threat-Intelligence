import { Controller, Get, Post, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { CampaignsService } from './campaigns.service';

@ApiTags('campaigns')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('campaigns')
export class CampaignsController {
  constructor(private readonly campaignsService: CampaignsService) {}

  @Get()
  @ApiOperation({ summary: 'List all threat campaigns with linked entity counts' })
  findAll() {
    return this.campaignsService.findAll();
  }

  @Post('cluster')
  @Roles(Role.ADMIN, Role.SOC_ANALYST)
  @ApiOperation({ summary: 'Run heuristic threat campaign clustering engine' })
  runClustering() {
    return this.campaignsService.runClustering();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get detailed campaign breakdown including all linked alerts, IOCs, malware, and CVEs' })
  findOne(@Param('id') id: string) {
    return this.campaignsService.findOne(id);
  }
}
