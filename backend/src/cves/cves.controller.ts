import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { CvesService } from './cves.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';

@ApiTags('CVEs')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('cves')
export class CvesController {
  constructor(private readonly cvesService: CvesService) {}

  @Get()
  @ApiOperation({ summary: 'List all CVE records (paginated from PostgreSQL)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  findAll(@Query('page') page?: number, @Query('limit') limit?: number) {
    return this.cvesService.findAll(page, limit);
  }

  @Get('search')
  @ApiOperation({ summary: 'Search CVEs via OpenSearch mirror' })
  @ApiQuery({ name: 'q', required: false, type: String, description: 'CVE ID or description search query' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  search(@Query('q') query?: string, @Query('page') page?: number, @Query('limit') limit?: number) {
    return this.cvesService.search(query || '', page, limit);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get CVE record details by ID or CVE ID' })
  findOne(@Param('id') id: string) {
    return this.cvesService.findOne(id);
  }
}
