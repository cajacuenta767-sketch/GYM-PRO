import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { paginate } from '../../common/utils';
import { AssignRoutineDto, CreateRoutineDto, QueryRoutinesDto, UpdateRoutineDto } from './dto/routine.dto';

const include = {
  member: { select: { id: true, code: true, firstName: true, lastName: true, photoUrl: true } },
  trainer: { select: { id: true, firstName: true, lastName: true } },
  days: {
    orderBy: [{ dayOfWeek: 'asc' as const }, { order: 'asc' as const }],
    include: { exercises: { orderBy: { order: 'asc' as const }, include: { exercise: { select: { id: true, name: true, equipment: true, difficulty: true, category: { select: { name: true } } } } } } },
  },
};

@Injectable()
export class RoutinesService {
  constructor(private prisma: PrismaService) {}

  findAll(query: QueryRoutinesDto) {
    const where: any = {};
    if (query.memberId) where.memberId = query.memberId;
    if (query.trainerId) where.trainerId = query.trainerId;
    if (query.goal) where.goal = query.goal;
    if (query.isTemplate !== undefined && query.isTemplate !== '') where.isTemplate = query.isTemplate === 'true';
    return paginate(this.prisma.routine, query, { where, include, searchFields: ['name', 'member.firstName', 'member.lastName', 'goal'], sortable: ['name', 'createdAt', 'level'], defaultSort: { updatedAt: 'desc' } });
  }

  findOne(id: string) { return this.prisma.routine.findUniqueOrThrow({ where: { id }, include }); }

  /** Rutina activa (más reciente) de un miembro. */
  activeForMember(memberId: string) {
    return this.prisma.routine.findFirst({ where: { memberId }, include, orderBy: { updatedAt: 'desc' } });
  }

  create(dto: CreateRoutineDto) {
    const { days, ...data } = dto;
    return this.prisma.routine.create({ data: { ...data, startDate: data.startDate ? new Date(data.startDate) : undefined, days: this.daysCreate(days) }, include });
  }

  async update(id: string, dto: UpdateRoutineDto) {
    const { days, ...data } = dto;
    return this.prisma.routine.update({
      where: { id },
      data: { ...data, startDate: data.startDate ? new Date(data.startDate) : undefined, ...(days ? { days: { deleteMany: {}, ...this.daysCreate(days) } } : {}) },
      include,
    });
  }

  /** Duplica una plantilla (o cualquier rutina) y la asigna a un miembro. */
  async assign(id: string, dto: AssignRoutineDto) {
    const source = await this.findOne(id);
    return this.prisma.routine.create({
      data: {
        name: source.name, description: source.description, goal: source.goal, level: source.level, weeks: source.weeks, isTemplate: false,
        memberId: dto.memberId, trainerId: dto.trainerId ?? source.trainerId, startDate: dto.startDate ? new Date(dto.startDate) : new Date(),
        days: { create: source.days.map((d, i) => ({ dayOfWeek: d.dayOfWeek, title: d.title, order: i, exercises: { create: d.exercises.map((e, j) => ({ exerciseId: e.exerciseId, order: j, sets: e.sets, reps: e.reps, restSeconds: e.restSeconds, weight: e.weight, notes: e.notes })) } })) },
      },
      include,
    });
  }

  remove(id: string) { return this.prisma.routine.delete({ where: { id }, select: { id: true } }); }

  private daysCreate(days?: CreateRoutineDto['days']) {
    if (!days?.length) return undefined;
    return { create: days.map((d, i) => ({ dayOfWeek: d.dayOfWeek, title: d.title, order: i, exercises: { create: d.exercises.map((e, j) => ({ exerciseId: e.exerciseId, order: j, sets: e.sets ?? 3, reps: e.reps ?? '12', restSeconds: e.restSeconds, weight: e.weight, notes: e.notes })) } })) };
  }
}
