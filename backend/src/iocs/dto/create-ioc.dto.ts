import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { IocType } from '@prisma/client';

export class CreateIocDto {
  @ApiProperty({ enum: IocType, example: IocType.IP })
  @IsEnum(IocType)
  type: IocType;

  @ApiProperty({ example: '198.51.100.45' })
  @IsString()
  @IsNotEmpty()
  value: string;

  @ApiProperty({ example: 'AlienVault OTX' })
  @IsString()
  @IsNotEmpty()
  source: string;

  @ApiPropertyOptional({ description: 'Optional case ID to link this IOC' })
  @IsOptional()
  @IsString()
  relatedCaseId?: string;
}
