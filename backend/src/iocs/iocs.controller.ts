import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { IocsService } from './iocs.service';
import { CreateIocDto } from './dto/create-ioc.dto';
import { UpdateIocDto } from './dto/update-ioc.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('IOCs')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('iocs')
export class IocsController {
  constructor(private readonly iocsService: IocsService) {}

  @Post()
  @Roles(Role.ADMIN, Role.SOC_ANALYST, Role.INVESTIGATOR)
  @ApiOperation({ summary: 'Register an Indicator of Compromise (IOC)' })
  @ApiResponse({ status: 201, description: 'IOC successfully recorded' })
  create(@Body() dto: CreateIocDto) {
    return this.iocsService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all IOC records (paginated from PostgreSQL)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  findAll(@Query('page') page?: number, @Query('limit') limit?: number) {
    return this.iocsService.findAll(page, limit);
  }

  @Get('search')
  @ApiOperation({ summary: 'Search IOCs via OpenSearch mirror' })
  @ApiQuery({ name: 'q', required: false, type: String, description: 'Search term or IP/domain/hash value' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  search(@Query('q') query?: string, @Query('page') page?: number, @Query('limit') limit?: number) {
    return this.iocsService.search(query || '', page, limit);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get IOC details by ID' })
  findOne(@Param('id') id: string) {
    return this.iocsService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.SOC_ANALYST, Role.INVESTIGATOR)
  @ApiOperation({ summary: 'Update IOC record or link to case' })
  update(@Param('id') id: string, @Body() dto: UpdateIocDto) {
    return this.iocsService.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.SOC_ANALYST)
  @ApiOperation({ summary: 'Delete an IOC entry' })
  remove(@Param('id') id: string) {
    return this.iocsService.remove(id);
  }
}
