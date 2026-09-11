import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { paginate } from '../../common/utils';
import { CreateActivityDto, QueryActivitiesDto, UpdateActivityDto } from './dto/activity.dto';

const include = { trainer: { select: { id: true, firstName: true, lastName: true, photoUrl: true } } };

@Injectable()
export class ActivitiesService {
  constructor(private prisma: PrismaService) {}

  findAll(query: QueryActivitiesDto) {
    const where: any = {};
    if (query.category) where.category = query.category;
    if (query.trainerId) where.trainerId = query.trainerId;
    return paginate(this.prisma.activity, query, {
      where,
      include,
      searchFields: ['name', 'category', 'trainer.firstName', 'trainer.lastName'],
      sortable: ['name', 'category', 'createdAt'],
      defaultSort: { name: 'asc' },
    });
  }

  async categories() {
    const rows = await this.prisma.activity.groupBy({ by: ['category'], _count: { _all: true }, orderBy: { category: 'asc' } });
    return rows.map((r) => ({ name: r.category, count: r._count._all }));
  }

  findOne(id: string) {
    return this.prisma.activity.findUniqueOrThrow({ where: { id }, include });
  }

  create(dto: CreateActivityDto) {
    return this.prisma.activity.create({ data: dto, include });
  }

  update(id: string, dto: UpdateActivityDto) {
    return this.prisma.activity.update({ where: { id }, data: dto, include });
  }

  remove(id: string) {
    return this.prisma.activity.delete({ where: { id }, select: { id: true } });
  }
}
