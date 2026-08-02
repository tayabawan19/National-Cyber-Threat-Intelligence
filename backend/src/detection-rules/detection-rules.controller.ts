import { Controller, Get, Post, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { DetectionRulesService, CreateRuleDto, UpdateRuleDto } from './detection-rules.service';

@ApiTags('detection-rules')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('detection-rules')
export class DetectionRulesController {
  constructor(private readonly detectionRulesService: DetectionRulesService) {}

  @Get()
  @ApiOperation({ summary: 'List all data-driven detection rules' })
  findAll() {
    return this.detectionRulesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get detection rule by ID' })
  findOne(@Param('id') id: string) {
    return this.detectionRulesService.findOne(id);
  }

  @Post()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Create a new detection rule (Admin only)' })
  create(@Body() dto: CreateRuleDto) {
    return this.detectionRulesService.create(dto);
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Update or toggle detection rule (Admin only)' })
  update(@Param('id') id: string, @Body() dto: UpdateRuleDto) {
    return this.detectionRulesService.update(id, dto);
  }
}
