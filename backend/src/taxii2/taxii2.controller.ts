import { Controller, Get, Param, UseGuards, Header } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Taxii2Service } from './taxii2.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@ApiTags('TAXII 2.1 Threat Sharing API')
@Controller('taxii2')
export class Taxii2Controller {
  constructor(private readonly taxii2Service: Taxii2Service) {}

  @Get()
  @ApiOperation({ summary: 'TAXII 2.1 Server Discovery Endpoint' })
  @Header('Content-Type', 'application/taxii+json;version=2.1')
  getDiscovery() {
    return this.taxii2Service.getDiscovery();
  }

  @Get('collections')
  @ApiOperation({ summary: 'TAXII 2.1 Server Collections List' })
  @Header('Content-Type', 'application/taxii+json;version=2.1')
  getCollections() {
    return this.taxii2Service.getCollections();
  }

  @Get('collections/:id/objects')
  @ApiOperation({ summary: 'TAXII 2.1 Collection STIX 2.1 Bundle Objects' })
  @Header('Content-Type', 'application/taxii+json;version=2.1')
  getObjects(@Param('id') id: string) {
    return this.taxii2Service.getCollectionObjects(id);
  }
}
