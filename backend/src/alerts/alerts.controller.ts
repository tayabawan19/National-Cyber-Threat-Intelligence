import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { AlertsService } from './alerts.service';
import { CreateAlertDto } from './dto/create-alert.dto';
import { UpdateAlertDto } from './dto/update-alert.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role, AlertStatus, Severity } from '@prisma/client';

@ApiTags('Alerts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('alerts')
export class AlertsController {
  constructor(private readonly alertsService: AlertsService) {}

  @Post()
  @Roles(Role.ADMIN, Role.SOC_ANALYST, Role.INVESTIGATOR)
  @ApiOperation({ summary: 'Create or ingest a security alert' })
  @ApiResponse({ status: 201, description: 'Alert created successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden for Read-only user' })
  create(@Body() dto: CreateAlertDto) {
    return this.alertsService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List alerts with optional status/severity filtering and pagination' })
  @ApiQuery({ name: 'status', enum: AlertStatus, required: false })
  @ApiQuery({ name: 'severity', enum: Severity, required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  findAll(
    @Query('status') status?: AlertStatus,
    @Query('severity') severity?: Severity,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.alertsService.findAll(status, severity, page, limit);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get alert details by ID' })
  findOne(@Param('id') id: string) {
    return this.alertsService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.SOC_ANALYST, Role.INVESTIGATOR)
  @ApiOperation({ summary: 'Update alert status (acknowledge/resolve) or link to case' })
  update(@Param('id') id: string, @Body() dto: UpdateAlertDto) {
    return this.alertsService.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.SOC_ANALYST)
  @ApiOperation({ summary: 'Delete a security alert' })
  remove(@Param('id') id: string) {
    return this.alertsService.remove(id);
  }
}
