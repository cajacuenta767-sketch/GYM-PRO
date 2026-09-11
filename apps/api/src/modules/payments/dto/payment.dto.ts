import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsDateString, IsIn, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { PaginationDto } from '../../../common/dto';

export const PAYMENT_METHODS = ['CASH', 'CARD', 'TRANSFER', 'STRIPE', 'ONLINE'] as const;
export const PAYMENT_STATUS = ['PAID', 'PENDING', 'FAILED', 'REFUNDED'] as const;

export class CreatePaymentDto {
  @ApiProperty() @IsString() memberId: string;
  @ApiPropertyOptional() @IsOptional() @IsString() subscriptionId?: string;
  @ApiProperty({ example: 'Membresía Oro · Septiembre' }) @IsString() concept: string;
  @ApiProperty() @IsNumber() @Min(0) amount: number;
  @ApiPropertyOptional({ enum: PAYMENT_METHODS }) @IsOptional() @IsIn(PAYMENT_METHODS as any) method?: string;
  @ApiPropertyOptional({ enum: PAYMENT_STATUS }) @IsOptional() @IsIn(PAYMENT_STATUS as any) status?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() reference?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() paidAt?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() dueDate?: string;
}
export class UpdatePaymentDto extends PartialType(CreatePaymentDto) {}

export class QueryPaymentsDto extends PaginationDto {
  @ApiPropertyOptional() @IsOptional() @IsString() memberId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() status?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() method?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() from?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() to?: string;
}

export class CheckoutDto {
  @ApiProperty() @IsString() memberId: string;
  @ApiProperty() @IsString() planId: string;
}

export class ConfirmCheckoutDto {
  @ApiProperty() @IsString() providerRef: string;
}
