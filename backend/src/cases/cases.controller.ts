import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { CasesService } from './cases.service';
import { CreateCaseDto } from './dto/create-case.dto';
import { UpdateCaseDto } from './dto/update-case.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('Cases')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('cases')
export class CasesController {
  constructor(private readonly casesService: CasesService) {}

  @Post()
  @Roles(Role.ADMIN, Role.SOC_ANALYST, Role.INVESTIGATOR)
  @ApiOperation({ summary: 'Create a new security case (Analyst/Investigator/Admin)' })
  @ApiResponse({ status: 201, description: 'Case created successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden for Read-only user' })
  create(@Body() dto: CreateCaseDto) {
    return this.casesService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all cases (Accessible to all authenticated users)' })
  findAll() {
    return this.casesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get case by ID with all linked alerts, IOCs, CVEs, and Malware' })
  findOne(@Param('id') id: string) {
    return this.casesService.findOne(id);
  }

  @Get(':id/timeline')
  @ApiOperation({ summary: 'Get audit log timeline for a specific case' })
  getTimeline(@Param('id') id: string) {
    return this.casesService.getTimeline(id);
  }

  @Post(':id/notes')
  @Roles(Role.ADMIN, Role.SOC_ANALYST, Role.INVESTIGATOR)
  @ApiOperation({ summary: 'Add an investigation note/comment to a case timeline' })
  addNote(@Param('id') id: string, @Body('note') noteText: string, @Req() req: any) {
    return this.casesService.addNote(id, req.user?.id, noteText);
  }

  @Post(':id/generate-report')
  @Roles(Role.ADMIN, Role.SOC_ANALYST, Role.INVESTIGATOR)
  @ApiOperation({ summary: 'Generate dual-audience AI incident report for C-Suite and Engineering' })
  generateReport(@Param('id') id: string) {
    return this.casesService.generateIncidentReport(id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.SOC_ANALYST, Role.INVESTIGATOR)
  @ApiOperation({ summary: 'Update security case details/status' })
  update(@Param('id') id: string, @Body() dto: UpdateCaseDto) {
    return this.casesService.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.SOC_ANALYST)
  @ApiOperation({ summary: 'Delete a security case' })
  remove(@Param('id') id: string) {
    return this.casesService.remove(id);
  }
}
