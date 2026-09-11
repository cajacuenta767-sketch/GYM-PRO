import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsArray, IsOptional, IsString } from 'class-validator';

export class CreateGroupDto {
  @ApiProperty({ example: 'Zumba' }) @IsString() name: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() imageUrl?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() color?: string;
  @ApiPropertyOptional({ type: [String] }) @IsOptional() @IsArray() memberIds?: string[];
}

export class UpdateGroupDto extends PartialType(CreateGroupDto) {}

export class GroupMembersDto {
  @ApiProperty({ type: [String] }) @IsArray() memberIds: string[];
}
