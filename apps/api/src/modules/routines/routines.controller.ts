import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ModuleKey } from '../../common/decorators';
import { AssignRoutineDto, CreateRoutineDto, QueryRoutinesDto, UpdateRoutineDto } from './dto/routine.dto';
import { RoutinesService } from './routines.service';

@ApiTags('Rutinas')
@ApiBearerAuth()
@ModuleKey('exercises')
@Controller('routines')
export class RoutinesController {
  constructor(private readonly service: RoutinesService) {}
  @Get('member/:memberId/active') active(@Param('memberId') memberId: string) { return this.service.activeForMember(memberId); }
  @Get() findAll(@Query() q: QueryRoutinesDto) { return this.service.findAll(q); }
  @Get(':id') findOne(@Param('id') id: string) { return this.service.findOne(id); }
  @Post() create(@Body() dto: CreateRoutineDto) { return this.service.create(dto); }
  @Post(':id/assign') @ApiOperation({ summary: 'Duplicar la rutina y asignarla a un miembro' }) assign(@Param('id') id: string, @Body() dto: AssignRoutineDto) { return this.service.assign(id, dto); }
  @Patch(':id') update(@Param('id') id: string, @Body() dto: UpdateRoutineDto) { return this.service.update(id, dto); }
  @Delete(':id') remove(@Param('id') id: string) { return this.service.remove(id); }
}
