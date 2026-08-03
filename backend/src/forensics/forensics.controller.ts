import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { ForensicsService, CreateArtifactDto } from './forensics.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('Digital Forensics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('forensics')
export class ForensicsController {
  constructor(private readonly forensicsService: ForensicsService) {}

  @Post('artifacts')
  @Roles(Role.ADMIN, Role.INVESTIGATOR)
  @ApiOperation({ summary: 'Attach a digital forensic artifact to a case (Investigator/Admin only)' })
  @ApiResponse({ status: 201, description: 'Artifact created successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden for non-investigator roles' })
  createArtifact(@Body() dto: CreateArtifactDto, @Req() req: any) {
    const userEmail = req.user?.email || req.user?.id || 'Investigator';
    return this.forensicsService.createArtifact(dto, userEmail);
  }

  @Post('artifacts/:id/custody')
  @Roles(Role.ADMIN, Role.INVESTIGATOR)
  @ApiOperation({ summary: 'Append a chain-of-custody action log to an artifact (Investigator/Admin only)' })
  appendCustodyAction(
    @Param('id') id: string,
    @Body('action') action: string,
    @Req() req: any,
  ) {
    const userEmail = req.user?.email || req.user?.id || 'Investigator';
    return this.forensicsService.appendCustodyAction(id, action, userEmail);
  }

  @Get('cases/:caseId')
  @ApiOperation({ summary: 'Get all forensic artifacts and custody trails for a case (All authenticated roles)' })
  findByCase(@Param('caseId') caseId: string) {
    return this.forensicsService.findByCase(caseId);
  }

  @Put('artifacts/:id')
  @Roles(Role.ADMIN, Role.INVESTIGATOR)
  @ApiOperation({ summary: 'Attempt to edit artifact (Rejected due to append-only forensic policy)' })
  updateArtifact() {
    return this.forensicsService.rejectEditOrDelete();
  }

  @Patch('artifacts/:id')
  @Roles(Role.ADMIN, Role.INVESTIGATOR)
  @ApiOperation({ summary: 'Attempt to patch artifact (Rejected due to append-only forensic policy)' })
  patchArtifact() {
    return this.forensicsService.rejectEditOrDelete();
  }

  @Delete('artifacts/:id')
  @Roles(Role.ADMIN, Role.INVESTIGATOR)
  @ApiOperation({ summary: 'Attempt to delete artifact (Rejected due to append-only forensic policy)' })
  deleteArtifact() {
    return this.forensicsService.rejectEditOrDelete();
  }
}
