import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { ReportsService } from './reports.service';

@ApiTags('Reportes')
@ApiBearerAuth()
@Controller('reports')
export class ReportsController {
  constructor(private readonly service: ReportsService) {}

  @Get('summary') summary() { return this.service.summary(); }
  @Get('revenue') @ApiQuery({ name: 'months', required: false }) revenue(@Query('months') months?: string) { return this.service.revenue(months ? Number(months) : 12); }
  @Get('members') @ApiQuery({ name: 'months', required: false }) members(@Query('months') months?: string) { return this.service.members(months ? Number(months) : 12); }
  @Get('attendance') @ApiQuery({ name: 'days', required: false }) attendance(@Query('days') days?: string) { return this.service.attendance(days ? Number(days) : 30); }
  @Get('classes') classes() { return this.service.classes(); }
  @Get('store') store() { return this.service.store(); }
}
