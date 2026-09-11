import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsBoolean, IsDateString, IsIn, IsInt, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';
import { PaginationDto } from '../../../common/dto';

export const SUBSCRIPTION_STATUS = ['ACTIVE', 'EXPIRED', 'CANCELLED', 'PENDING'] as const;

export class CreateSubscriptionDto {
  @ApiProperty() @IsString() memberId: string;
  @ApiProperty() @IsString() planId: string;
  @ApiPropertyOptional({ description: 'Por defecto: hoy' }) @IsOptional() @IsDateString() startDate?: string;
  @ApiPropertyOptional({ description: 'Por defecto: inicio + duración del plan' }) @IsOptional() @IsDateString() endDate?: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() price?: number;
  @ApiPropertyOptional({ enum: SUBSCRIPTION_STATUS }) @IsOptional() @IsIn(SUBSCRIPTION_STATUS as any) status?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
  @ApiPropertyOptional({ description: 'Registrar el pago automáticamente' }) @IsOptional() @IsBoolean() registerPayment?: boolean;
  @ApiPropertyOptional({ enum: ['CASH', 'CARD', 'TRANSFER', 'STRIPE'] }) @IsOptional() @IsString() paymentMethod?: string;
}
export class UpdateSubscriptionDto extends PartialType(CreateSubscriptionDto) {}

export class QuerySubscriptionsDto extends PaginationDto {
  @ApiPropertyOptional() @IsOptional() @IsString() memberId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() planId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() status?: string;
}

export class FreezeDto {
  @ApiProperty({ example: 15, description: 'Días de congelación' }) @IsInt() @Min(1) @Max(90) days: number;
  @ApiPropertyOptional({ description: 'Por defecto: hoy' }) @IsOptional() @IsDateString() startDate?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() reason?: string;
}
