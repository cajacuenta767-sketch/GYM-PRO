import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsDateString, IsEmail, IsIn, IsNumber, IsOptional, IsString } from 'class-validator';
import { PaginationDto } from '../../../common/dto';

export const MEMBER_STATUS = ['ACTIVE', 'INACTIVE', 'SUSPENDED', 'EXPIRED'] as const;
export const GENDERS = ['FEMENINO', 'MASCULINO', 'OTRO'] as const;
export const MEASUREMENT_TYPES = ['WEIGHT', 'WAIST', 'HEIGHT', 'BODY_FAT', 'CHEST', 'HIPS', 'ARM'] as const;

export class CreateMemberDto {
  @ApiPropertyOptional({ description: 'Se genera automáticamente si se omite' }) @IsOptional() @IsString() code?: string;
  @ApiProperty() @IsString() firstName: string;
  @ApiProperty() @IsString() lastName: string;
  @ApiPropertyOptional() @IsOptional() @IsEmail() email?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() phone?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() address?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() birthDate?: string;
  @ApiPropertyOptional({ enum: GENDERS }) @IsOptional() @IsIn(GENDERS as any) gender?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() photoUrl?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() username?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() planId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() trainerId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() interestArea?: string;
  @ApiPropertyOptional({ enum: MEMBER_STATUS }) @IsOptional() @IsIn(MEMBER_STATUS as any) status?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() joinDate?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() expiresAt?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() emergencyContact?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
  @ApiPropertyOptional({ type: [String] }) @IsOptional() @IsArray() groupIds?: string[];
  @ApiPropertyOptional({ type: [String] }) @IsOptional() @IsArray() classIds?: string[];
  @ApiPropertyOptional() @IsOptional() @IsString() branchId?: string;
  @ApiPropertyOptional({ description: 'Crear cuenta de acceso al portal con esta contraseña' }) @IsOptional() @IsString() portalPassword?: string;
}

export class UpdateMemberDto extends PartialType(CreateMemberDto) {}

export class QueryMembersDto extends PaginationDto {
  @ApiPropertyOptional({ enum: MEMBER_STATUS }) @IsOptional() @IsString() status?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() planId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() trainerId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() groupId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() branchId?: string;
}

export class BulkMembersDto {
  @ApiProperty({ type: [String] }) @IsArray() ids: string[];
  @ApiPropertyOptional({ enum: MEMBER_STATUS }) @IsOptional() @IsIn(MEMBER_STATUS as any) status?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() trainerId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() groupId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() branchId?: string;
}

export class CreateMeasurementDto {
  @ApiProperty({ enum: MEASUREMENT_TYPES }) @IsIn(MEASUREMENT_TYPES as any) type: string;
  @ApiProperty() @Type(() => Number) @IsNumber() value: number;
  @ApiPropertyOptional() @IsOptional() @IsString() unit?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() note?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() measuredAt?: string;
}
