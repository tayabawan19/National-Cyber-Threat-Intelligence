import { Controller, Get, Query, Headers, Header } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { SiemService } from './siem.service';
import { Severity } from '@prisma/client';

@ApiTags('SIEM Integration')
@Controller('siem')
export class SiemController {
  constructor(private readonly siemService: SiemService) {}

  @Get('export')
  @ApiOperation({ summary: 'Export platform alert data for external SIEM tools (Splunk, QRadar, etc.) using API-key authentication' })
  @ApiQuery({ name: 'format', required: false, enum: ['json', 'cef'], description: 'Export format: cef or json (default)' })
  @ApiQuery({ name: 'startTime', required: false, description: 'ISO start date filter' })
  @ApiQuery({ name: 'endTime', required: false, description: 'ISO end date filter' })
  @ApiQuery({ name: 'severity', required: false, enum: Severity, description: 'Filter alerts by severity level' })
  @ApiQuery({ name: 'apiKey', required: false, description: 'Service API Key (alternative to X-SIEM-API-KEY header)' })
  @ApiResponse({ status: 200, description: 'SIEM export stream generated successfully' })
  @ApiResponse({ status: 401, description: 'Missing or invalid SIEM API key' })
  async export(
    @Query('format') format?: 'cef' | 'json',
    @Query('startTime') startTime?: string,
    @Query('endTime') endTime?: string,
    @Query('severity') severity?: Severity,
    @Query('apiKey') queryApiKey?: string,
    @Headers('x-siem-api-key') headerApiKey?: string,
  ) {
    const key = headerApiKey || queryApiKey;
    this.siemService.validateApiKey(key);

    return this.siemService.exportAlerts({
      format,
      startTime,
      endTime,
      severity,
    });
  }
}
