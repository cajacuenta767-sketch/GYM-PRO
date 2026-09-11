import { Controller, Get, Query } from '@nestjs/common';
import { ModuleKey } from '../../common/decorators';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';

@ApiTags('Tablero')
@ApiBearerAuth()
@ModuleKey('dashboard')
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly service: DashboardService) {}

  @Get('overview') overview() { return this.service.overview(); }

  @Get('calendar')
  @ApiQuery({ name: 'from', required: false })
  @ApiQuery({ name: 'to', required: false })
  calendar(@Query('from') from?: string, @Query('to') to?: string) { return this.service.calendar(from, to); }
}
