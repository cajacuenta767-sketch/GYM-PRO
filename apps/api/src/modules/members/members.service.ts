import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { paginate } from '../../common/utils';
import { CreateMeasurementDto, CreateMemberDto, QueryMembersDto, UpdateMemberDto } from './dto/member.dto';

const listInclude = {
  plan: { select: { id: true, name: true, color: true } },
  trainer: { select: { id: true, firstName: true, lastName: true } },
};

const detailInclude = {
  plan: true,
  trainer: { select: { id: true, firstName: true, lastName: true, photoUrl: true, specialty: true } },
  groups: { include: { group: { select: { id: true, name: true, color: true } } } },
  classes: { include: { class: { select: { id: true, name: true, color: true } } } },
  subscriptions: { include: { plan: { select: { name: true } } }, orderBy: { startDate: 'desc' as const }, take: 10 },
  payments: { orderBy: { paidAt: 'desc' as const }, take: 10 },
  attendance: { orderBy: { checkIn: 'desc' as const }, take: 15 },
  bookings: { include: { class: { select: { name: true, color: true } } }, orderBy: { date: 'desc' as const }, take: 10 },
  measurements: { orderBy: { measuredAt: 'asc' as const } },
};

@Injectable()
export class MembersService {
  constructor(private prisma: PrismaService) {}

  findAll(query: QueryMembersDto) {
    const where: any = {};
    if (query.status) where.status = query.status;
    if (query.planId) where.planId = query.planId;
    if (query.trainerId) where.trainerId = query.trainerId;
    if (query.groupId) where.groups = { some: { groupId: query.groupId } };

    return paginate(this.prisma.member, query, {
      where,
      include: listInclude,
      searchFields: ['firstName', 'lastName', 'code', 'email', 'phone'],
      sortable: ['firstName', 'lastName', 'code', 'status', 'joinDate', 'expiresAt', 'createdAt'],
      defaultSort: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const member = await this.prisma.member.findUnique({ where: { id }, include: detailInclude });
    if (!member) throw new NotFoundException('Miembro no encontrado');
    return this.serializeDetail(member);
  }

  async findByQr(token: string) {
    const member = await this.prisma.member.findUnique({
      where: { qrToken: token },
      include: { plan: { select: { name: true, color: true } } },
    });
    if (!member) throw new NotFoundException('Código QR no válido');
    return member;
  }

  async create(dto: CreateMemberDto) {
    const { groupIds, classIds, ...data } = dto;
    const code = data.code ?? (await this.nextCode());
    return this.prisma.member.create({
      data: {
        ...data,
        code,
        birthDate: data.birthDate ? new Date(data.birthDate) : undefined,
        joinDate: data.joinDate ? new Date(data.joinDate) : undefined,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,
        groups: groupIds?.length ? { create: groupIds.map((groupId) => ({ groupId })) } : undefined,
        classes: classIds?.length ? { create: classIds.map((classId) => ({ classId })) } : undefined,
      },
      include: listInclude,
    });
  }

  async update(id: string, dto: UpdateMemberDto) {
    const { groupIds, classIds, ...data } = dto;
    return this.prisma.member.update({
      where: { id },
      data: {
        ...data,
        birthDate: data.birthDate !== undefined ? (data.birthDate ? new Date(data.birthDate) : null) : undefined,
        joinDate: data.joinDate ? new Date(data.joinDate) : undefined,
        expiresAt: data.expiresAt !== undefined ? (data.expiresAt ? new Date(data.expiresAt) : null) : undefined,
        ...(groupIds ? { groups: { deleteMany: {}, create: groupIds.map((groupId) => ({ groupId })) } } : {}),
        ...(classIds ? { classes: { deleteMany: {}, create: classIds.map((classId) => ({ classId })) } } : {}),
      },
      include: listInclude,
    });
  }

  remove(id: string) {
    return this.prisma.member.delete({ where: { id }, select: { id: true } });
  }

  // ── Mediciones ──
  listMeasurements(memberId: string, type?: string) {
    return this.prisma.measurement.findMany({
      where: { memberId, ...(type ? { type } : {}) },
      orderBy: { measuredAt: 'asc' },
    });
  }

  addMeasurement(memberId: string, dto: CreateMeasurementDto) {
    return this.prisma.measurement.create({
      data: {
        memberId,
        type: dto.type,
        value: dto.value,
        unit: dto.unit ?? defaultUnit(dto.type),
        note: dto.note,
        measuredAt: dto.measuredAt ? new Date(dto.measuredAt) : new Date(),
      },
    });
  }

  removeMeasurement(memberId: string, id: string) {
    return this.prisma.measurement.delete({ where: { id, memberId }, select: { id: true } });
  }

  async stats() {
    const now = new Date();
    const in7 = new Date(now.getTime() + 7 * 86_400_000);
    const [total, active, expired, expiringSoon, newThisMonth] = await Promise.all([
      this.prisma.member.count(),
      this.prisma.member.count({ where: { status: 'ACTIVE' } }),
      this.prisma.member.count({ where: { status: 'EXPIRED' } }),
      this.prisma.member.count({ where: { status: 'ACTIVE', expiresAt: { gte: now, lte: in7 } } }),
      this.prisma.member.count({ where: { joinDate: { gte: new Date(now.getFullYear(), now.getMonth(), 1) } } }),
    ]);
    return { total, active, expired, expiringSoon, newThisMonth };
  }

  private async nextCode() {
    const last = await this.prisma.member.findFirst({ orderBy: { createdAt: 'desc' }, select: { code: true } });
    const n = last ? parseInt(last.code.replace(/\D/g, ''), 10) + 1 : 30001;
    return `M${n}`;
  }

  private serializeDetail(member: any) {
    return {
      ...member,
      groups: member.groups.map((g: any) => g.group),
      classes: member.classes.map((c: any) => c.class),
    };
  }
}

function defaultUnit(type: string) {
  switch (type) {
    case 'WEIGHT': return 'kg';
    case 'BODY_FAT': return '%';
    default: return 'cm';
  }
}
