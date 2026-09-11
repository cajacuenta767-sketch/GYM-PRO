import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ModuleKey } from '../../common/decorators';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CreateNutritionDto, QueryNutritionDto, UpdateNutritionDto } from './dto/nutrition.dto';
import { NutritionService } from './nutrition.service';

@ApiTags('Nutrición')
@ApiBearerAuth()
@ModuleKey('nutrition')
@Controller('nutrition')
export class NutritionController {
  constructor(private readonly service: NutritionService) {}

  @Get('member/:memberId/weekly') weekly(@Param('memberId') memberId: string) { return this.service.weeklyPlan(memberId); }
  @Get() findAll(@Query() query: QueryNutritionDto) { return this.service.findAll(query); }
  @Get(':id') findOne(@Param('id') id: string) { return this.service.findOne(id); }
  @Post() create(@Body() dto: CreateNutritionDto) { return this.service.create(dto); }
  @Patch(':id') update(@Param('id') id: string, @Body() dto: UpdateNutritionDto) { return this.service.update(id, dto); }
  @Delete(':id') remove(@Param('id') id: string) { return this.service.remove(id); }
}
