import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsBoolean, IsDateString, IsIn, IsNumber, IsOptional, IsString } from 'class-validator';
import { PaginationDto } from '../../../common/dto';

export const BOOKING_STATUS = ['CONFIRMED', 'CANCELLED', 'ATTENDED', 'NO_SHOW'] as const;

export class CreateBookingDto {
  @ApiProperty() @IsString() memberId: string;
  @ApiProperty() @IsString() classId: string;
  @ApiPropertyOptional() @IsOptional() @IsString() scheduleId?: string;
  @ApiProperty() @IsDateString() date: string;
  @ApiPropertyOptional({ enum: BOOKING_STATUS }) @IsOptional() @IsIn(BOOKING_STATUS as any) status?: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() paid?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsNumber() amount?: number;
}

export class UpdateBookingDto extends PartialType(CreateBookingDto) {}

export class QueryBookingsDto extends PaginationDto {
  @ApiPropertyOptional() @IsOptional() @IsString() status?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() classId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() memberId?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() from?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() to?: string;
}
