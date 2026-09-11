import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsDateString, IsIn, IsNumber, IsOptional, IsString } from 'class-validator';

export class PortalBookingDto {
  @ApiProperty() @IsString() classId: string;
  @ApiPropertyOptional() @IsOptional() @IsString() scheduleId?: string;
  @ApiProperty() @IsDateString() date: string;
  @ApiPropertyOptional({ description: 'Unirse a la lista de espera si la clase está llena' }) @IsOptional() @IsBoolean() waitlist?: boolean;
}

export class PortalMeasurementDto {
  @ApiProperty({ enum: ['WEIGHT', 'WAIST'] }) @IsIn(['WEIGHT', 'WAIST', 'HIPS', 'CHEST', 'ARM']) type: string;
  @ApiProperty() @IsNumber() value: number;
  @ApiPropertyOptional() @IsOptional() @IsString() note?: string;
}

export class PortalProfileDto {
  @ApiPropertyOptional() @IsOptional() @IsString() phone?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() address?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() emergencyContact?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() interestArea?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() photoUrl?: string;
}

export class PortalCheckoutDto {
  @ApiProperty() @IsString() planId: string;
}

export class PortalRsvpDto {
  @ApiPropertyOptional({ enum: ['GOING', 'MAYBE', 'DECLINED'] }) @IsOptional() @IsIn(['GOING', 'MAYBE', 'DECLINED']) status?: string;
}
