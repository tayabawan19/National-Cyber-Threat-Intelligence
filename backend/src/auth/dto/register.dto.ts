import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
import { Role } from '@prisma/client';

export class RegisterDto {
  @ApiProperty({ example: 'analyst@cyberintel.gov', description: 'New user email' })
  @IsEmail({}, { message: 'Please provide a valid email address.' })
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'AnalystPass2026!', description: 'New user password' })
  @IsString()
  @IsNotEmpty()
  @MinLength(6, { message: 'Password must be at least 6 characters.' })
  password: string;

  @ApiPropertyOptional({ enum: Role, default: Role.READ_ONLY, description: 'Role assigned to user' })
  @IsOptional()
  @IsEnum(Role)
  role?: Role;
}
