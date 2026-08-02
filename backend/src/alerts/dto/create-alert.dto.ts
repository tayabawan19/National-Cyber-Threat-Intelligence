import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { AlertStatus, Severity } from '@prisma/client';

export class CreateAlertDto {
  @ApiProperty({ example: 'CrowdStrike-EDR' })
  @IsString()
  @IsNotEmpty()
  source: string;

  @ApiProperty({ example: 'Unusual PowerShell execution with base64 encoded payload.' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiPropertyOptional({ enum: Severity, default: Severity.MEDIUM })
  @IsOptional()
  @IsEnum(Severity)
  severity?: Severity;

  @ApiPropertyOptional({ enum: AlertStatus, default: AlertStatus.NEW })
  @IsOptional()
  @IsEnum(AlertStatus)
  status?: AlertStatus;

  @ApiPropertyOptional({ description: 'Optional case ID to link this alert to' })
  @IsOptional()
  @IsString()
  relatedCaseId?: string;
}
