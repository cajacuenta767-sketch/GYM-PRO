import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { PaginationDto } from '../../common/dto';
import { paginate } from '../../common/utils';
import {
  CreateExerciseCategoryDto, CreateExerciseDto, QueryExercisesDto, UpdateExerciseCategoryDto, UpdateExerciseDto,
} from './dto/exercise.dto';

const include = { category: { select: { id: true, name: true, muscleGroup: true } } };

@Injectable()
export class ExercisesService {
  constructor(private prisma: PrismaService) {}

  // ── Ejercicios ──
  findAll(query: QueryExercisesDto) {
    const where: any = {};
    if (query.categoryId) where.categoryId = query.categoryId;
    if (query.difficulty) where.difficulty = query.difficulty;
    return paginate(this.prisma.exercise, query, {
      where,
      include,
      searchFields: ['name', 'equipment', 'category.name'],
      sortable: ['name', 'difficulty', 'createdAt'],
      defaultSort: { name: 'asc' },
    });
  }
  findOne(id: string) { return this.prisma.exercise.findUniqueOrThrow({ where: { id }, include }); }
  create(dto: CreateExerciseDto) { return this.prisma.exercise.create({ data: dto, include }); }
  update(id: string, dto: UpdateExerciseDto) { return this.prisma.exercise.update({ where: { id }, data: dto, include }); }
  remove(id: string) { return this.prisma.exercise.delete({ where: { id }, select: { id: true } }); }

  // ── Categorías ──
  findCategories(query: PaginationDto) {
    return paginate(this.prisma.exerciseCategory, query, {
      include: { _count: { select: { exercises: true } } },
      searchFields: ['name', 'muscleGroup'],
      sortable: ['name', 'createdAt'],
      defaultSort: { name: 'asc' },
    });
  }
  createCategory(dto: CreateExerciseCategoryDto) { return this.prisma.exerciseCategory.create({ data: dto }); }
  updateCategory(id: string, dto: UpdateExerciseCategoryDto) { return this.prisma.exerciseCategory.update({ where: { id }, data: dto }); }
  removeCategory(id: string) { return this.prisma.exerciseCategory.delete({ where: { id }, select: { id: true } }); }
}
