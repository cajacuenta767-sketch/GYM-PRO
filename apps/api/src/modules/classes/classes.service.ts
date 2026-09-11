import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { paginate } from '../../common/utils';
import { CreateClassDto, QueryClassesDto, UpdateClassDto } from './dto/class.dto';

const include = {
  trainer: { select: { id: true, firstName: true, lastName: true, photoUrl: true } },
  schedules: { orderBy: [{ dayOfWeek: 'asc' as const }, { startTime: 'asc' as const }] },
  _count: { select: { members: true, bookings: true } },
};

@Injectable()
export class ClassesService {
  constructor(private prisma: PrismaService) {}

  findAll(query: QueryClassesDto) {
    const where: any = {};
    if (query.trainerId) where.trainerId = query.trainerId;
    if (query.isActive !== undefined && query.isActive !== '') where.isActive = query.isActive === 'true';
    return paginate(this.prisma.gymClass, query, {
      where,
      include,
      searchFields: ['name', 'location', 'trainer.firstName', 'trainer.lastName'],
      sortable: ['name', 'location', 'bookingFee', 'capacity', 'createdAt'],
      defaultSort: { name: 'asc' },
    });
  }

  findOne(id: string) {
    return this.prisma.gymClass.findUniqueOrThrow({
      where: { id },
      include: {
        ...include,
        members: { include: { member: { select: { id: true, code: true, firstName: true, lastName: true, photoUrl: true } } } },
      },
    });
  }

  /** Horario semanal completo agrupado por día (0..6). */
  async weekly() {
    const schedules = await this.prisma.classSchedule.findMany({
      where: { class: { isActive: true } },
      include: { class: { include: { trainer: { select: { firstName: true, lastName: true } } } } },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    });
    const days = Array.from({ length: 7 }, (_, i) => ({ dayOfWeek: i, slots: [] as any[] }));
    for (const s of schedules) {
      days[s.dayOfWeek].slots.push({
        scheduleId: s.id,
        classId: s.classId,
        name: s.class.name,
        color: s.class.color,
        location: s.class.location,
        trainer: s.class.trainer ? `${s.class.trainer.firstName} ${s.class.trainer.lastName}` : null,
        startTime: s.startTime,
        endTime: s.endTime,
        capacity: s.class.capacity,
      });
    }
    return days;
  }

  create(dto: CreateClassDto) {
    const { schedules, ...data } = dto;
    return this.prisma.gymClass.create({
      data: { ...data, schedules: schedules?.length ? { create: schedules } : undefined },
      include,
    });
  }

  update(id: string, dto: UpdateClassDto) {
    const { schedules, ...data } = dto;
    return this.prisma.gymClass.update({
      where: { id },
      data: { ...data, ...(schedules ? { schedules: { deleteMany: {}, create: schedules } } : {}) },
      include,
    });
  }

  remove(id: string) {
    return this.prisma.gymClass.delete({ where: { id }, select: { id: true } });
  }
}
