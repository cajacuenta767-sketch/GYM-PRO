import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsBoolean, IsDateString, IsIn, IsInt, IsNumber, IsOptional, IsString } from 'class-validator';
import { PaginationDto } from '../../../common/dto';

export const EVENT_TYPES = ['EVENT', 'COMPETITION', 'WORKSHOP', 'HOLIDAY'] as const;

export class CreateEventDto {
  @ApiProperty() @IsString() title: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional({ enum: EVENT_TYPES }) @IsOptional() @IsIn(EVENT_TYPES as any) type?: string;
  @ApiProperty() @IsDateString() startsAt: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() endsAt?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() location?: string;
  @ApiPropertyOptional() @IsOptional() @IsInt() capacity?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() fee?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() imageUrl?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() color?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() branchId?: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isPublic?: boolean;
}
export class UpdateEventDto extends PartialType(CreateEventDto) {}

export class QueryEventsDto extends PaginationDto {
  @ApiPropertyOptional() @IsOptional() @IsString() branchId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() type?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() from?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() to?: string;
}

export class RsvpDto {
  @ApiProperty() @IsString() memberId: string;
  @ApiPropertyOptional({ enum: ['GOING', 'MAYBE', 'DECLINED'] }) @IsOptional() @IsIn(['GOING', 'MAYBE', 'DECLINED']) status?: string;
}
