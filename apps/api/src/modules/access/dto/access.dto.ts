import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsArray, IsDateString, IsOptional, IsString } from 'class-validator';
import { PaginationDto } from '../../../common/dto';

export class CreateRoleDto {
  @ApiProperty({ example: 'Recepción' }) @IsString() name: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiProperty({ type: [String], example: ['members.read', 'attendance.write'] }) @IsArray() permissions: string[];
}
export class UpdateRoleDto extends PartialType(CreateRoleDto) {}

export class QueryAccessLogsDto extends PaginationDto {
  @ApiPropertyOptional() @IsOptional() @IsString() memberId?: string;
  @ApiPropertyOptional() @IsOptional() allowed?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() from?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() to?: string;
}
