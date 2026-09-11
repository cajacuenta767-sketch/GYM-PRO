import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { paginate } from '../../common/utils';
import { CreateNutritionDto, QueryNutritionDto, UpdateNutritionDto } from './dto/nutrition.dto';

const include = {
  member: { select: { id: true, code: true, firstName: true, lastName: true, photoUrl: true } },
  nutritionist: { select: { id: true, firstName: true, lastName: true } },
};

@Injectable()
export class NutritionService {
  constructor(private prisma: PrismaService) {}

  findAll(query: QueryNutritionDto) {
    const where: any = {};
    if (query.memberId) where.memberId = query.memberId;
    if (query.dayOfWeek !== undefined && query.dayOfWeek !== '') where.dayOfWeek = Number(query.dayOfWeek);
    return paginate(this.prisma.nutritionSchedule, query, {
      where,
      include,
      searchFields: ['description', 'member.firstName', 'member.lastName'],
      sortable: ['dayOfWeek', 'mealType', 'calories', 'createdAt'],
      defaultSort: { dayOfWeek: 'asc' },
    });
  }

  /** Plan semanal de un miembro agrupado por día. */
  async weeklyPlan(memberId: string) {
    const rows = await this.prisma.nutritionSchedule.findMany({
      where: { memberId },
      include,
      orderBy: [{ dayOfWeek: 'asc' }],
    });
    const order = ['BREAKFAST', 'SNACK_AM', 'LUNCH', 'SNACK_PM', 'DINNER'];
    const days = Array.from({ length: 7 }, (_, i) => ({ dayOfWeek: i, meals: [] as any[], calories: 0 }));
    for (const r of rows) {
      days[r.dayOfWeek].meals.push(r);
      days[r.dayOfWeek].calories += r.calories ?? 0;
    }
    days.forEach((d) => d.meals.sort((a, b) => order.indexOf(a.mealType) - order.indexOf(b.mealType)));
    return days;
  }

  findOne(id: string) {
    return this.prisma.nutritionSchedule.findUniqueOrThrow({ where: { id }, include });
  }

  create(dto: CreateNutritionDto) {
    return this.prisma.nutritionSchedule.create({ data: dto, include });
  }

  update(id: string, dto: UpdateNutritionDto) {
    return this.prisma.nutritionSchedule.update({ where: { id }, data: dto, include });
  }

  remove(id: string) {
    return this.prisma.nutritionSchedule.delete({ where: { id }, select: { id: true } });
  }
}
