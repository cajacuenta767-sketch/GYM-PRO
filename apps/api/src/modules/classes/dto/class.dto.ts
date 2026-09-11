import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsInt, IsNumber, IsOptional, IsString, Matches, Max, Min, ValidateNested } from 'class-validator';
import { PaginationDto } from '../../../common/dto';

export class ScheduleDto {
  @ApiProperty({ example: 1, description: '0=Domingo … 6=Sábado' }) @IsInt() @Min(0) @Max(6) dayOfWeek: number;
  @ApiProperty({ example: '09:15' }) @Matches(/^\d{2}:\d{2}$/) startTime: string;
  @ApiProperty({ example: '11:45' }) @Matches(/^\d{2}:\d{2}$/) endTime: string;
}

export class CreateClassDto {
  @ApiProperty({ example: 'Clase de Yoga' }) @IsString() name: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() trainerId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() location?: string;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(1) capacity?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) bookingFee?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() color?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() branchId?: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isActive?: boolean;
  @ApiPropertyOptional({ type: [ScheduleDto] })
  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => ScheduleDto)
  schedules?: ScheduleDto[];
}

export class UpdateClassDto extends PartialType(CreateClassDto) {}

export class QueryClassesDto extends PaginationDto {
  @ApiPropertyOptional() @IsOptional() @IsString() branchId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() trainerId?: string;
  @ApiPropertyOptional() @IsOptional() isActive?: string;
}
