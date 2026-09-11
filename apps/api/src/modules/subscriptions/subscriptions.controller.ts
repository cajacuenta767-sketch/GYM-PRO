import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CreateSubscriptionDto, FreezeDto, QuerySubscriptionsDto, UpdateSubscriptionDto } from './dto/subscription.dto';
import { ModuleKey } from '../../common/decorators';
import { SubscriptionsService } from './subscriptions.service';

@ApiTags('Historial de suscripción')
@ApiBearerAuth()
@ModuleKey('subscriptions')
@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly service: SubscriptionsService) {}

  @Get('stats') stats() { return this.service.stats(); }
  @Get() findAll(@Query() query: QuerySubscriptionsDto) { return this.service.findAll(query); }
  @Get(':id') findOne(@Param('id') id: string) { return this.service.findOne(id); }
  @Post() create(@Body() dto: CreateSubscriptionDto) { return this.service.create(dto); }
  @Patch(':id') update(@Param('id') id: string, @Body() dto: UpdateSubscriptionDto) { return this.service.update(id, dto); }
  @Post(':id/freeze') freeze(@Param('id') id: string, @Body() dto: FreezeDto) { return this.service.freeze(id, dto); }
  @Post(':id/unfreeze') unfreeze(@Param('id') id: string) { return this.service.unfreeze(id); }
  @Delete(':id') remove(@Param('id') id: string) { return this.service.remove(id); }
}
