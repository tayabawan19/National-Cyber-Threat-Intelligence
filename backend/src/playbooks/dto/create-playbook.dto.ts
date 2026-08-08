import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsObject, IsArray } from 'class-validator';

export class CreatePlaybookDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsObject()
  @IsNotEmpty()
  triggerCondition: Record<string, any>;

  @IsArray()
  @IsNotEmpty()
  actions: Array<{
    type: 'CREATE_CASE' | 'ESCALATE_SEVERITY' | 'ASSIGN_ANALYST' | 'FORWARD_SIEM';
    targetSeverity?: string;
    assigneeId?: string;
    details?: any;
  }>;

  @IsBoolean()
  @IsOptional()
  enabled?: boolean;
}
