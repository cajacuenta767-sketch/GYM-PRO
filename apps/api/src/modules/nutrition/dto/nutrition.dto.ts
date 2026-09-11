import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { PaginationDto } from '../../../common/dto';

export const MEAL_TYPES = ['BREAKFAST', 'SNACK_AM', 'LUNCH', 'SNACK_PM', 'DINNER'] as const;

export class CreateNutritionDto {
  @ApiProperty() @IsString() memberId: string;
  @ApiPropertyOptional() @IsOptional() @IsString() nutritionistId?: string;
  @ApiProperty({ example: 1 }) @IsInt() @Min(0) @Max(6) dayOfWeek: number;
  @ApiProperty({ enum: MEAL_TYPES }) @IsIn(MEAL_TYPES as any) mealType: string;
  @ApiProperty() @IsString() description: string;
  @ApiPropertyOptional() @IsOptional() @IsInt() calories?: number;
  @ApiPropertyOptional() @IsOptional() @IsInt() protein?: number;
  @ApiPropertyOptional() @IsOptional() @IsInt() carbs?: number;
  @ApiPropertyOptional() @IsOptional() @IsInt() fats?: number;
}

export class UpdateNutritionDto extends PartialType(CreateNutritionDto) {}

export class QueryNutritionDto extends PaginationDto {
  @ApiPropertyOptional() @IsOptional() @IsString() memberId?: string;
  @ApiPropertyOptional() @IsOptional() dayOfWeek?: string;
}
