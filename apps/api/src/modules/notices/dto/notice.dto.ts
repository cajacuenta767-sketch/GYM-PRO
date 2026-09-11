import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsBoolean, IsDateString, IsIn, IsOptional, IsString } from 'class-validator';
import { PaginationDto } from '../../../common/dto';

export const NOTICE_TYPES = ['INFO', 'WARNING', 'URGENT', 'PROMO'] as const;

export class CreateNoticeDto {
  @ApiProperty() @IsString() title: string;
  @ApiProperty() @IsString() content: string;
  @ApiPropertyOptional({ enum: NOTICE_TYPES }) @IsOptional() @IsIn(NOTICE_TYPES as any) type?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() audience?: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isPinned?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsDateString() startsAt?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() endsAt?: string;
}
export class UpdateNoticeDto extends PartialType(CreateNoticeDto) {}

export class QueryNoticesDto extends PaginationDto {
  @ApiPropertyOptional() @IsOptional() @IsString() type?: string;
  @ApiPropertyOptional() @IsOptional() active?: string;
}
