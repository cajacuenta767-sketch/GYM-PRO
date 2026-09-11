import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CheckInDto, ManualAttendanceDto, QueryAttendanceDto } from './dto/attendance.dto';
import { AttendanceService } from './attendance.service';

@ApiTags('Asistencia')
@ApiBearerAuth()
@Controller('attendance')
export class AttendanceController {
  constructor(private readonly service: AttendanceService) {}

  @Get('today') @ApiOperation({ summary: 'Asistencia del día y aforo actual' }) today() { return this.service.today(); }
  @Get('stats') stats() { return this.service.stats(); }
  @Get() findAll(@Query() query: QueryAttendanceDto) { return this.service.findAll(query); }
  @Post('check-in') @ApiOperation({ summary: 'Entrada/salida por QR, código o id' }) checkIn(@Body() dto: CheckInDto) { return this.service.checkIn(dto); }
  @Post('manual') manual(@Body() dto: ManualAttendanceDto) { return this.service.createManual(dto); }
  @Patch(':id/check-out') checkOut(@Param('id') id: string) { return this.service.checkOut(id); }
  @Delete(':id') remove(@Param('id') id: string) { return this.service.remove(id); }
}
