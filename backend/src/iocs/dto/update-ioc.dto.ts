import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { IocType } from '@prisma/client';

export class UpdateIocDto {
  @ApiPropertyOptional({ enum: IocType })
  @IsOptional()
  @IsEnum(IocType)
  type?: IocType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  value?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  source?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  relatedCaseId?: string;
}
