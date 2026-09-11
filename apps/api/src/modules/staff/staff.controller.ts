import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ModuleKey, Roles } from '../../common/decorators';
import { CreateStaffDto, QueryStaffDto, UpdateStaffDto } from './dto/staff.dto';
import { StaffService } from './staff.service';

@ApiTags('Equipo')
@ApiBearerAuth()
@ModuleKey('staff')
@Controller('staff')
export class StaffController {
  constructor(private readonly service: StaffService) {}

  @Get() findAll(@Query() query: QueryStaffDto) { return this.service.findAll(query); }
  @Get(':id') findOne(@Param('id') id: string) { return this.service.findOne(id); }
  @Post() @Roles('ADMIN') create(@Body() dto: CreateStaffDto) { return this.service.create(dto); }
  @Patch(':id') @Roles('ADMIN') update(@Param('id') id: string, @Body() dto: UpdateStaffDto) { return this.service.update(id, dto); }
  @Delete(':id') @Roles('ADMIN') remove(@Param('id') id: string) { return this.service.remove(id); }
}
