import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsInt, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateMembershipDto {
  @ApiProperty({ example: 'Miembro Oro' }) @IsString() name: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiProperty({ example: 180 }) @IsInt() @Min(1) durationDays: number;
  @ApiProperty({ example: 120 }) @IsNumber() @Min(0) price: number;
  @ApiPropertyOptional({ example: 5 }) @IsOptional() @IsNumber() @Min(0) registrationFee?: number;
  @ApiPropertyOptional({ example: 1 }) @IsOptional() @IsInt() @Min(1) installments?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() color?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() iconUrl?: string;
  @ApiPropertyOptional({ type: [String] }) @IsOptional() @IsArray() benefits?: string[];
  @ApiPropertyOptional() @IsOptional() @IsString() stripePriceId?: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isActive?: boolean;
  @ApiPropertyOptional({ type: [String], description: 'IDs de actividades incluidas' })
  @IsOptional() @IsArray() activityIds?: string[];
}

export class UpdateMembershipDto extends PartialType(CreateMembershipDto) {}
