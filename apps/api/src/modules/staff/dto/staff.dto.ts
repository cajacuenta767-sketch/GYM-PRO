import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsBoolean, IsDateString, IsEmail, IsIn, IsNumber, IsOptional, IsString } from 'class-validator';
import { PaginationDto } from '../../../common/dto';

export const STAFF_ROLES = ['TRAINER', 'RECEPTIONIST', 'MANAGER', 'NUTRITIONIST', 'ACCOUNTANT', 'CLEANING'] as const;

export class CreateStaffDto {
  @ApiPropertyOptional() @IsOptional() @IsString() code?: string;
  @ApiProperty() @IsString() firstName: string;
  @ApiProperty() @IsString() lastName: string;
  @ApiPropertyOptional() @IsOptional() @IsEmail() email?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() phone?: string;
  @ApiPropertyOptional({ enum: STAFF_ROLES }) @IsOptional() @IsIn(STAFF_ROLES as any) role?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() specialty?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() photoUrl?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() hireDate?: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() salary?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() bio?: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isActive?: boolean;
}

export class UpdateStaffDto extends PartialType(CreateStaffDto) {}

export class QueryStaffDto extends PaginationDto {
  @ApiPropertyOptional({ enum: STAFF_ROLES }) @IsOptional() @IsString() role?: string;
  @ApiPropertyOptional() @IsOptional() isActive?: string;
}
