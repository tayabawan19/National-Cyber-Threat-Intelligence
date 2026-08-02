import { Controller, Get, Post, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { ThreatFeedsService } from './threat-feeds.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('Threat Feeds')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('threat-feeds')
export class ThreatFeedsController {
  constructor(private readonly threatFeedsService: ThreatFeedsService) {}

  @Get()
  @ApiOperation({ summary: 'List all configured threat feeds and sync history' })
  @ApiResponse({ status: 200, description: 'Threat feed status list retrieved' })
  findAll() {
    return this.threatFeedsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get details and sync logs for a specific threat feed' })
  findOne(@Param('id') id: string) {
    return this.threatFeedsService.findOne(id);
  }

  @Post(':id/sync')
  @Roles(Role.ADMIN, Role.SOC_ANALYST)
  @ApiOperation({ summary: 'Manually trigger background sync job for a threat feed' })
  @ApiResponse({ status: 202, description: 'Ingestion job enqueued in BullMQ' })
  triggerSync(@Param('id') id: string) {
    return this.threatFeedsService.triggerSync(id);
  }

  @Post('reindex')
  @Roles(Role.ADMIN, Role.SOC_ANALYST)
  @ApiOperation({ summary: 'Rebuild OpenSearch search mirror indices from PostgreSQL source of truth' })
  @ApiResponse({ status: 200, description: 'OpenSearch indices successfully rebuilt' })
  reindex() {
    return this.threatFeedsService.reindexSearchMirror();
  }
}
