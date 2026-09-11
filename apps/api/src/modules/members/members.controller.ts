import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { CreateMeasurementDto, CreateMemberDto, QueryMembersDto, UpdateMemberDto } from './dto/member.dto';
import { MembersService } from './members.service';

@ApiTags('Miembros')
@ApiBearerAuth()
@Controller('members')
export class MembersController {
  constructor(private readonly service: MembersService) {}

  @Get('stats') @ApiOperation({ summary: 'Indicadores de miembros' })
  stats() { return this.service.stats(); }

  @Get('qr/:token') @ApiOperation({ summary: 'Buscar miembro por su código QR' })
  byQr(@Param('token') token: string) { return this.service.findByQr(token); }

  @Get() findAll(@Query() query: QueryMembersDto) { return this.service.findAll(query); }
  @Get(':id') findOne(@Param('id') id: string) { return this.service.findOne(id); }
  @Post() create(@Body() dto: CreateMemberDto) { return this.service.create(dto); }
  @Patch(':id') update(@Param('id') id: string, @Body() dto: UpdateMemberDto) { return this.service.update(id, dto); }
  @Delete(':id') remove(@Param('id') id: string) { return this.service.remove(id); }

  @Get(':id/measurements') @ApiQuery({ name: 'type', required: false })
  measurements(@Param('id') id: string, @Query('type') type?: string) { return this.service.listMeasurements(id, type); }

  @Post(':id/measurements')
  addMeasurement(@Param('id') id: string, @Body() dto: CreateMeasurementDto) { return this.service.addMeasurement(id, dto); }

  @Delete(':id/measurements/:measurementId')
  removeMeasurement(@Param('id') id: string, @Param('measurementId') mid: string) { return this.service.removeMeasurement(id, mid); }
}
