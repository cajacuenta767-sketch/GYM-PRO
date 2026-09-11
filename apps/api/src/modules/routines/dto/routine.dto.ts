import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsDateString, IsIn, IsInt, IsOptional, IsString, Max, Min, ValidateNested } from 'class-validator';
import { PaginationDto } from '../../../common/dto';

export const ROUTINE_GOALS = ['HYPERTROPHY', 'STRENGTH', 'FAT_LOSS', 'ENDURANCE', 'MOBILITY', 'GENERAL'] as const;

export class RoutineExerciseDto {
  @ApiProperty() @IsString() exerciseId: string;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(1) sets?: number;
  @ApiPropertyOptional({ example: '8-10' }) @IsOptional() @IsString() reps?: string;
  @ApiPropertyOptional() @IsOptional() @IsInt() restSeconds?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() weight?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
}

export class RoutineDayDto {
  @ApiProperty() @IsInt() @Min(0) @Max(6) dayOfWeek: number;
  @ApiPropertyOptional({ example: 'Pierna y glúteo' }) @IsOptional() @IsString() title?: string;
  @ApiProperty({ type: [RoutineExerciseDto] }) @IsArray() @ValidateNested({ each: true }) @Type(() => RoutineExerciseDto) exercises: RoutineExerciseDto[];
}

export class CreateRoutineDto {
  @ApiProperty() @IsString() name: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional({ enum: ROUTINE_GOALS }) @IsOptional() @IsIn(ROUTINE_GOALS as any) goal?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() level?: string;
  @ApiPropertyOptional() @IsOptional() @IsInt() weeks?: number;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isTemplate?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsString() memberId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() trainerId?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() startDate?: string;
  @ApiPropertyOptional({ type: [RoutineDayDto] }) @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => RoutineDayDto) days?: RoutineDayDto[];
}
export class UpdateRoutineDto extends PartialType(CreateRoutineDto) {}

export class AssignRoutineDto {
  @ApiProperty() @IsString() memberId: string;
  @ApiPropertyOptional() @IsOptional() @IsString() trainerId?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() startDate?: string;
}

export class QueryRoutinesDto extends PaginationDto {
  @ApiPropertyOptional() @IsOptional() @IsString() memberId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() trainerId?: string;
  @ApiPropertyOptional() @IsOptional() isTemplate?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() goal?: string;
}
