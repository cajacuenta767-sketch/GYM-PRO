import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser, PortalAccess } from '../../common/decorators';
import { PortalBookingDto, PortalCheckoutDto, PortalMeasurementDto, PortalProfileDto, PortalRsvpDto } from './dto/portal.dto';
import { PortalService } from './portal.service';

@ApiTags('Portal del miembro')
@ApiBearerAuth()
@PortalAccess()
@Controller('portal')
export class PortalController {
  constructor(private readonly service: PortalService) {}

  @Get('home') home(@CurrentUser('memberId') id: string) { return this.service.home(id); }
  @Patch('profile') profile(@CurrentUser('memberId') id: string, @Body() dto: PortalProfileDto) { return this.service.updateProfile(id, dto); }
  @Get('classes/weekly') weekly() { return this.service.weekly(); }
  @Get('bookings') bookings(@CurrentUser('memberId') id: string) { return this.service.myBookings(id); }
  @Post('bookings') book(@CurrentUser('memberId') id: string, @Body() dto: PortalBookingDto) { return this.service.book(id, dto); }
  @Delete('bookings/:bookingId') cancel(@CurrentUser('memberId') id: string, @Param('bookingId') bookingId: string) { return this.service.cancelBooking(id, bookingId); }
  @Get('nutrition') nutrition(@CurrentUser('memberId') id: string) { return this.service.nutritionPlan(id); }
  @Get('routine') routine(@CurrentUser('memberId') id: string) { return this.service.routine(id); }
  @Get('measurements') measurements(@CurrentUser('memberId') id: string) { return this.service.measurements(id); }
  @Post('measurements') addMeasurement(@CurrentUser('memberId') id: string, @Body() dto: PortalMeasurementDto) { return this.service.addMeasurement(id, dto); }
  @Get('payments') payments(@CurrentUser('memberId') id: string) { return this.service.payments(id); }
  @Get('attendance') attendance(@CurrentUser('memberId') id: string) { return this.service.attendance(id); }
  @Get('plans') plans() { return this.service.plans(); }
  @Post('checkout') checkout(@CurrentUser('memberId') id: string, @Body() dto: PortalCheckoutDto) { return this.service.checkout(id, dto.planId); }
  @Get('events') events(@CurrentUser('memberId') id: string) { return this.service.events(id); }
  @Post('events/:eventId/rsvp') rsvp(@CurrentUser('memberId') id: string, @Param('eventId') eventId: string, @Body() dto: PortalRsvpDto) { return this.service.rsvp(id, eventId, dto.status); }
}
