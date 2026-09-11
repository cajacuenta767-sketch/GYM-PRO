import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { paginate } from '../../common/utils';
import { CreateStaffDto, QueryStaffDto, UpdateStaffDto } from './dto/staff.dto';
import { NotFoundException } from '@nestjs/common';

const include = { branch: { select: { id: true, name: true } }, _count: { select: { members: true, classes: true, activities: true } } };

@Injectable()
export class StaffService {
  constructor(private prisma: PrismaService) {}

  findAll(query: QueryStaffDto) {
    const where: any = {};
    if (query.role) where.role = query.role;
    if (query.branchId) where.branchId = query.branchId;
    if (query.isActive !== undefined && query.isActive !== '') where.isActive = query.isActive === 'true';
    return paginate(this.prisma.staff, query, {
      where,
      include,
      searchFields: ['firstName', 'lastName', 'code', 'email', 'specialty'],
      sortable: ['firstName', 'lastName', 'role', 'hireDate', 'createdAt'],
      defaultSort: { firstName: 'asc' },
    });
  }

  findOne(id: string) {
    return this.prisma.staff.findUniqueOrThrow({
      where: { id },
      include: {
        ...include,
        classes: { select: { id: true, name: true, color: true, schedules: true } },
        members: { select: { id: true, code: true, firstName: true, lastName: true, photoUrl: true, status: true }, take: 20 },
      },
    });
  }

  async create(dto: CreateStaffDto) {
    const code = dto.code ?? (await this.nextCode());
    return this.prisma.staff.create({
      data: { ...dto, code, hireDate: dto.hireDate ? new Date(dto.hireDate) : undefined },
      include,
    });
  }

  update(id: string, dto: UpdateStaffDto) {
    return this.prisma.staff.update({
      where: { id },
      data: { ...dto, hireDate: dto.hireDate ? new Date(dto.hireDate) : undefined },
      include,
    });
  }

  remove(id: string) {
    return this.prisma.staff.delete({ where: { id }, select: { id: true } });
  }

  /** Agenda del integrante autenticado: clases de hoy, reservas, miembros a cargo y rutinas. */
  async agenda(staffId?: string | null) {
    if (!staffId) throw new NotFoundException('Tu cuenta no está vinculada a un integrante del equipo');
    const staff = await this.prisma.staff.findUniqueOrThrow({ where: { id: staffId }, include: { branch: { select: { name: true } } } });
    const now = new Date();
    const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const dayEnd = new Date(dayStart.getTime() + 86_400_000 - 1);
    const [classes, todayBookings, members, routines] = await Promise.all([
      this.prisma.gymClass.findMany({ where: { trainerId: staffId, isActive: true }, include: { schedules: true, _count: { select: { members: true } } } }),
      this.prisma.booking.findMany({ where: { class: { trainerId: staffId }, date: { gte: dayStart, lte: dayEnd }, status: { in: ['CONFIRMED', 'ATTENDED', 'WAITLISTED'] } }, include: { member: { select: { id: true, firstName: true, lastName: true, photoUrl: true, code: true } }, class: { select: { id: true, name: true, color: true } } }, orderBy: { date: 'asc' } }),
      this.prisma.member.findMany({ where: { trainerId: staffId }, include: { plan: { select: { name: true, color: true } }, attendance: { orderBy: { checkIn: 'desc' }, take: 1 }, routines: { select: { id: true }, take: 1 } }, orderBy: { firstName: 'asc' } }),
      this.prisma.routine.count({ where: { trainerId: staffId, isTemplate: false } }),
    ]);
    const today = now.getDay();
    const todayClasses = classes.flatMap((c) => c.schedules.filter((s) => s.dayOfWeek === today).map((s) => ({ classId: c.id, name: c.name, color: c.color, location: c.location, capacity: c.capacity, startTime: s.startTime, endTime: s.endTime, enrolled: c._count.members, bookings: todayBookings.filter((b) => b.classId === c.id) }))).sort((a, b) => a.startTime.localeCompare(b.startTime));
    const week = [0, 1, 2, 3, 4, 5, 6].map((d) => ({ dayOfWeek: d, slots: classes.flatMap((c) => c.schedules.filter((s) => s.dayOfWeek === d).map((s) => ({ name: c.name, color: c.color, startTime: s.startTime, endTime: s.endTime }))).sort((a, b) => a.startTime.localeCompare(b.startTime)) }));
    return {
      staff: { id: staff.id, name: `${staff.firstName} ${staff.lastName}`, role: staff.role, specialty: staff.specialty, branch: staff.branch?.name ?? null },
      todayClasses, week,
      members: members.map((m) => ({ id: m.id, code: m.code, name: `${m.firstName} ${m.lastName}`, photoUrl: m.photoUrl, status: m.status, plan: m.plan, expiresAt: m.expiresAt, lastVisit: m.attendance[0]?.checkIn ?? null, hasRoutine: m.routines.length > 0 })),
      stats: { classes: classes.length, todayBookings: todayBookings.length, members: members.length, routines, inactiveMembers: members.filter((m) => !m.attendance[0] || m.attendance[0].checkIn < new Date(now.getTime() - 14 * 86_400_000)).length },
    };
  }

  private async nextCode() {
    const count = await this.prisma.staff.count();
    return `E${String(count + 1).padStart(4, '0')}`;
  }
}
