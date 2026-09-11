import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ModuleKey } from '../../common/decorators';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreateClassDto, QueryClassesDto, UpdateClassDto } from './dto/class.dto';
import { ClassesService } from './classes.service';

@ApiTags('Clases')
@ApiBearerAuth()
@ModuleKey('classes')
@Controller('classes')
export class ClassesController {
  constructor(private readonly service: ClassesService) {}

  @Get('weekly') @ApiOperation({ summary: 'Horario semanal de clases' })
  weekly() { return this.service.weekly(); }

  @Get() findAll(@Query() query: QueryClassesDto) { return this.service.findAll(query); }
  @Get(':id') findOne(@Param('id') id: string) { return this.service.findOne(id); }
  @Post() create(@Body() dto: CreateClassDto) { return this.service.create(dto); }
  @Patch(':id') update(@Param('id') id: string, @Body() dto: UpdateClassDto) { return this.service.update(id, dto); }
  @Delete(':id') remove(@Param('id') id: string) { return this.service.remove(id); }
}
