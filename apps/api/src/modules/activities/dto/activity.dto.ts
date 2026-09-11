import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString } from 'class-validator';
import { PaginationDto } from '../../../common/dto';

export class CreateActivityDto {
  @ApiProperty({ example: 'Pesos libres' }) @IsString() name: string;
  @ApiProperty({ example: 'Fuerza' }) @IsString() category: string;
  @ApiPropertyOptional() @IsOptional() @IsString() trainerId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional() @IsOptional() @IsInt() durationMin?: number;
  @ApiPropertyOptional() @IsOptional() @IsInt() calories?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() imageUrl?: string;
}

export class UpdateActivityDto extends PartialType(CreateActivityDto) {}

export class QueryActivitiesDto extends PaginationDto {
  @ApiPropertyOptional() @IsOptional() @IsString() category?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() trainerId?: string;
}
