import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { PlaybooksService } from './playbooks.service';
import { CreatePlaybookDto } from './dto/create-playbook.dto';
import { UpdatePlaybookDto } from './dto/update-playbook.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

@ApiTags('SOAR Playbooks')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('playbooks')
export class PlaybooksController {
  constructor(private readonly playbooksService: PlaybooksService) {}

  @Post()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Create a new SOAR response playbook (ADMIN only)' })
  create(@Body() createPlaybookDto: CreatePlaybookDto) {
    return this.playbooksService.create(createPlaybookDto);
  }

  @Get()
  @Roles(Role.ADMIN, Role.INVESTIGATOR, Role.SOC_ANALYST, Role.READ_ONLY)
  @ApiOperation({ summary: 'Get all configured playbooks' })
  findAll() {
    return this.playbooksService.findAll();
  }

  @Get('executions')
  @Roles(Role.ADMIN, Role.INVESTIGATOR, Role.SOC_ANALYST, Role.READ_ONLY)
  @ApiOperation({ summary: 'Get playbook execution history' })
  getExecutionHistory() {
    return this.playbooksService.getExecutionHistory();
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.INVESTIGATOR, Role.SOC_ANALYST, Role.READ_ONLY)
  @ApiOperation({ summary: 'Get a single playbook by ID' })
  findOne(@Param('id') id: string) {
    return this.playbooksService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Update a playbook (ADMIN only)' })
  update(@Param('id') id: string, @Body() updatePlaybookDto: UpdatePlaybookDto) {
    return this.playbooksService.update(id, updatePlaybookDto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Delete a playbook (ADMIN only)' })
  remove(@Param('id') id: string) {
    return this.playbooksService.remove(id);
  }
}
