import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CreateEventDto, QueryEventsDto, RsvpDto, UpdateEventDto } from './dto/event.dto';
import { EventsService } from './events.service';

@ApiTags('Eventos')
@ApiBearerAuth()
@Controller('events')
export class EventsController {
  constructor(private readonly service: EventsService) {}

  @Get('upcoming') upcoming() { return this.service.upcoming(); }
  @Get() findAll(@Query() query: QueryEventsDto) { return this.service.findAll(query); }
  @Get(':id') findOne(@Param('id') id: string) { return this.service.findOne(id); }
  @Post() create(@Body() dto: CreateEventDto) { return this.service.create(dto); }
  @Patch(':id') update(@Param('id') id: string, @Body() dto: UpdateEventDto) { return this.service.update(id, dto); }
  @Delete(':id') remove(@Param('id') id: string) { return this.service.remove(id); }
  @Post(':id/rsvp') rsvp(@Param('id') id: string, @Body() dto: RsvpDto) { return this.service.rsvp(id, dto); }
}
