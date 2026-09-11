import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PaginationDto } from '../../common/dto';
import {
  CreateExerciseCategoryDto, CreateExerciseDto, QueryExercisesDto, UpdateExerciseCategoryDto, UpdateExerciseDto,
} from './dto/exercise.dto';
import { ExercisesService } from './exercises.service';

@ApiTags('Ejercicios')
@ApiBearerAuth()
@Controller('exercises')
export class ExercisesController {
  constructor(private readonly service: ExercisesService) {}

  @Get('categories') categories(@Query() query: PaginationDto) { return this.service.findCategories(query); }
  @Post('categories') createCategory(@Body() dto: CreateExerciseCategoryDto) { return this.service.createCategory(dto); }
  @Patch('categories/:id') updateCategory(@Param('id') id: string, @Body() dto: UpdateExerciseCategoryDto) { return this.service.updateCategory(id, dto); }
  @Delete('categories/:id') removeCategory(@Param('id') id: string) { return this.service.removeCategory(id); }

  @Get() findAll(@Query() query: QueryExercisesDto) { return this.service.findAll(query); }
  @Get(':id') findOne(@Param('id') id: string) { return this.service.findOne(id); }
  @Post() create(@Body() dto: CreateExerciseDto) { return this.service.create(dto); }
  @Patch(':id') update(@Param('id') id: string, @Body() dto: UpdateExerciseDto) { return this.service.update(id, dto); }
  @Delete(':id') remove(@Param('id') id: string) { return this.service.remove(id); }
}
