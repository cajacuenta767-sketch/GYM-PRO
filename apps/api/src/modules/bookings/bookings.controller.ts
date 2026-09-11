import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CreateBookingDto, QueryBookingsDto, UpdateBookingDto } from './dto/booking.dto';
import { BookingsService } from './bookings.service';
import { ModuleKey } from '../../common/decorators';

@ApiTags('Reservas')
@ApiBearerAuth()
@ModuleKey('bookings')
@Controller('bookings')
export class BookingsController {
  constructor(private readonly service: BookingsService) {}

  @Get('stats') stats() { return this.service.stats(); }
  @Get() findAll(@Query() query: QueryBookingsDto) { return this.service.findAll(query); }
  @Get(':id') findOne(@Param('id') id: string) { return this.service.findOne(id); }
  @Post() create(@Body() dto: CreateBookingDto) { return this.service.create(dto); }
  @Patch(':id') update(@Param('id') id: string, @Body() dto: UpdateBookingDto) { return this.service.update(id, dto); }
  @Get(':id/waitlist-position') position(@Param('id') id: string) { return this.service.waitlistPosition(id); }
  @Post(':id/cancel') cancel(@Param('id') id: string) { return this.service.cancel(id); }
  @Delete(':id') remove(@Param('id') id: string) { return this.service.remove(id); }
}
