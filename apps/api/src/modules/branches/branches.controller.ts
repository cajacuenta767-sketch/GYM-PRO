import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ModuleKey, Roles } from '../../common/decorators';
import { CreateBranchDto, UpdateBranchDto } from './dto/branch.dto';
import { BranchesService } from './branches.service';

@ApiTags('Sedes')
@ApiBearerAuth()
@ModuleKey('settings')
@Controller('branches')
export class BranchesController {
  constructor(private readonly service: BranchesService) {}
  @Get() findAll() { return this.service.findAll(); }
  @Get(':id') findOne(@Param('id') id: string) { return this.service.findOne(id); }
  @Post() @Roles('ADMIN') create(@Body() dto: CreateBranchDto) { return this.service.create(dto); }
  @Patch(':id') @Roles('ADMIN') update(@Param('id') id: string, @Body() dto: UpdateBranchDto) { return this.service.update(id, dto); }
  @Delete(':id') @Roles('ADMIN') remove(@Param('id') id: string) { return this.service.remove(id); }
}
