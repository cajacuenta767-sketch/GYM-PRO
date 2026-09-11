import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsDateString, IsIn, IsOptional, IsString } from 'class-validator';
import { PaginationDto } from '../../../common/dto';

export const AUDIENCES = ['ALL', 'MEMBERS', 'STAFF', 'ACTIVE_MEMBERS', 'EXPIRED_MEMBERS'] as const;
export const NEWSLETTER_STATUS = ['DRAFT', 'SCHEDULED', 'SENT'] as const;

export class CreateNewsletterDto {
  @ApiProperty() @IsString() title: string;
  @ApiProperty() @IsString() subject: string;
  @ApiProperty() @IsString() content: string;
  @ApiPropertyOptional({ enum: AUDIENCES }) @IsOptional() @IsIn(AUDIENCES as any) audience?: string;
  @ApiPropertyOptional({ enum: NEWSLETTER_STATUS }) @IsOptional() @IsIn(NEWSLETTER_STATUS as any) status?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() scheduledAt?: string;
}
export class UpdateNewsletterDto extends PartialType(CreateNewsletterDto) {}

export class QueryNewslettersDto extends PaginationDto {
  @ApiPropertyOptional() @IsOptional() @IsString() status?: string;
}
