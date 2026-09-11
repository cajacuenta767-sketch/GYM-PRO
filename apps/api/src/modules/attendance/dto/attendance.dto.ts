import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsIn, IsOptional, IsString } from 'class-validator';
import { PaginationDto } from '../../../common/dto';

export class CheckInDto {
  @ApiPropertyOptional({ description: 'ID del miembro (o usar qrToken / code)' }) @IsOptional() @IsString() memberId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() qrToken?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() code?: string;
  @ApiPropertyOptional({ enum: ['QR', 'MANUAL', 'CARD'] }) @IsOptional() @IsIn(['QR', 'MANUAL', 'CARD']) method?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() note?: string;
}

export class QueryAttendanceDto extends PaginationDto {
  @ApiPropertyOptional() @IsOptional() @IsString() memberId?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() from?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() to?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() method?: string;
}

export class ManualAttendanceDto {
  @ApiProperty() @IsString() memberId: string;
  @ApiProperty() @IsDateString() checkIn: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() checkOut?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() note?: string;
}
