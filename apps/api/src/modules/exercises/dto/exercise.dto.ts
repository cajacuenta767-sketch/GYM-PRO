import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsIn, IsInt, IsOptional, IsString } from 'class-validator';
import { PaginationDto } from '../../../common/dto';

export const DIFFICULTIES = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'] as const;

export class CreateExerciseCategoryDto {
  @ApiProperty({ example: 'Abdominales' }) @IsString() name: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() muscleGroup?: string;
}
export class UpdateExerciseCategoryDto extends PartialType(CreateExerciseCategoryDto) {}

export class CreateExerciseDto {
  @ApiProperty({ example: 'Crunch resistido' }) @IsString() name: string;
  @ApiPropertyOptional() @IsOptional() @IsString() categoryId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional({ enum: DIFFICULTIES }) @IsOptional() @IsIn(DIFFICULTIES as any) difficulty?: string;
  @ApiPropertyOptional() @IsOptional() @IsInt() sets?: number;
  @ApiPropertyOptional() @IsOptional() @IsInt() reps?: number;
  @ApiPropertyOptional() @IsOptional() @IsInt() restSeconds?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() equipment?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() videoUrl?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() imageUrl?: string;
}
export class UpdateExerciseDto extends PartialType(CreateExerciseDto) {}

export class QueryExercisesDto extends PaginationDto {
  @ApiPropertyOptional() @IsOptional() @IsString() categoryId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() difficulty?: string;
}
