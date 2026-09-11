import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../common/decorators';
import { CreatePaymentDto, QueryPaymentsDto, UpdatePaymentDto } from './dto/payment.dto';
import { PaymentsService } from './payments.service';

@ApiTags('Pagos')
@ApiBearerAuth()
@Controller('payments')
export class PaymentsController {
  constructor(private readonly service: PaymentsService) {}

  @Get('stats') stats() { return this.service.stats(); }
  @Get() findAll(@Query() query: QueryPaymentsDto) { return this.service.findAll(query); }
  @Get(':id') findOne(@Param('id') id: string) { return this.service.findOne(id); }
  @Post() @Roles('ADMIN', 'ACCOUNTANT', 'STAFF') create(@Body() dto: CreatePaymentDto) { return this.service.create(dto); }
  @Patch(':id') @Roles('ADMIN', 'ACCOUNTANT') update(@Param('id') id: string, @Body() dto: UpdatePaymentDto) { return this.service.update(id, dto); }
  @Delete(':id') @Roles('ADMIN') remove(@Param('id') id: string) { return this.service.remove(id); }
}
