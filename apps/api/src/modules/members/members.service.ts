import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import * as XLSX from 'xlsx';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../../database/prisma.service';
import { paginate } from '../../common/utils';
import { BulkMembersDto, CreateMeasurementDto, CreateMemberDto, QueryMembersDto, UpdateMemberDto } from './dto/member.dto';

const listInclude = {
  plan: { select: { id: true, name: true, color: true } },
  trainer: { select: { id: true, firstName: true, lastName: true } },
  branch: { select: { id: true, name: true } },
  user: { select: { id: true, email: true, isActive: true } },
};

const detailInclude = {
  plan: true,
  branch: { select: { id: true, name: true } },
  user: { select: { id: true, email: true, isActive: true, lastLoginAt: true } },
  freezes: { orderBy: { startDate: 'desc' as const }, take: 5 },
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
  constructor(private prisma: PrismaService, private notifications: NotificationsService) {}

  findAll(query: QueryMembersDto) {
    const where: any = {};
    if (query.status) where.status = query.status;
    if (query.planId) where.planId = query.planId;
    if (query.trainerId) where.trainerId = query.trainerId;
    if (query.groupId) where.groups = { some: { groupId: query.groupId } };
    if (query.branchId) where.branchId = query.branchId;

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
    const { groupIds, classIds, portalPassword, ...data } = dto;
    const code = data.code ?? (await this.nextCode());
    const member = await this.prisma.member.create({
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
    if (portalPassword && member.email) await this.createPortalAccount(member.id, portalPassword);
    this.notifications.sendWelcome(member.id).catch(() => null);
    return this.prisma.member.findUniqueOrThrow({ where: { id: member.id }, include: listInclude });
  }

  /** Crea (o reactiva) la cuenta de acceso al portal del miembro. */
  async createPortalAccount(memberId: string, password: string) {
    const m = await this.prisma.member.findUniqueOrThrow({ where: { id: memberId } });
    if (!m.email) throw new BadRequestException('El miembro necesita un correo para tener acceso al portal');
    const hashed = await bcrypt.hash(password, 10);
    if (m.userId) {
      await this.prisma.user.update({ where: { id: m.userId }, data: { password: hashed, isActive: true } });
      return { userId: m.userId, email: m.email, updated: true };
    }
    const existing = await this.prisma.user.findUnique({ where: { email: m.email.toLowerCase() } });
    if (existing) throw new BadRequestException('Ya existe una cuenta con ese correo');
    const user = await this.prisma.user.create({ data: { email: m.email.toLowerCase(), password: hashed, name: `${m.firstName} ${m.lastName}`, role: 'MEMBER', avatarUrl: m.photoUrl } });
    await this.prisma.member.update({ where: { id: m.id }, data: { userId: user.id } });
    return { userId: user.id, email: m.email, created: true };
  }

  async update(id: string, dto: UpdateMemberDto) {
    const { groupIds, classIds, portalPassword, ...data } = dto;
    if (portalPassword) await this.createPortalAccount(id, portalPassword);
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

  /** Acciones en lote sobre varios miembros. */
  async bulk(dto: BulkMembersDto) {
    const data: any = {};
    if (dto.status) data.status = dto.status;
    if (dto.trainerId !== undefined) data.trainerId = dto.trainerId || null;
    if (dto.branchId !== undefined) data.branchId = dto.branchId || null;
    let updated = 0;
    if (Object.keys(data).length) updated = (await this.prisma.member.updateMany({ where: { id: { in: dto.ids } }, data })).count;
    if (dto.groupId) {
      const existing = await this.prisma.groupMember.findMany({ where: { groupId: dto.groupId, memberId: { in: dto.ids } }, select: { memberId: true } });
      const have = new Set(existing.map((e) => e.memberId));
      await this.prisma.groupMember.createMany({ data: dto.ids.filter((id) => !have.has(id)).map((memberId) => ({ groupId: dto.groupId!, memberId })) });
    }
    return { updated, ids: dto.ids.length };
  }

  /** Importación desde CSV/XLSX. Columnas: nombre, apellidos, correo, telefono, genero, nacimiento, plan, direccion, estado. */
  async importFile(buffer: Buffer, filename: string) {
    const wb = XLSX.read(buffer, { type: 'buffer', cellDates: true, raw: false });
    const sheet = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json<Record<string, any>>(sheet, { defval: '' });
    if (!rows.length) throw new BadRequestException('El archivo no tiene filas');
    const plans = await this.prisma.membershipPlan.findMany();
    const norm = (v: any) => String(v ?? '').trim();
    const key = (row: Record<string, any>, ...names: string[]) => { for (const n of names) { const k = Object.keys(row).find((c) => c.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '') === n); if (k !== undefined) return norm(row[k]); } return ''; };
    const result = { created: 0, skipped: 0, errors: [] as string[], file: filename };
    let seq = await this.prisma.member.count();
    for (const [i, row] of rows.entries()) {
      const firstName = key(row, 'nombre', 'nombres', 'firstname', 'first_name');
      const lastName = key(row, 'apellidos', 'apellido', 'lastname', 'last_name');
      if (!firstName) { result.errors.push(`Fila ${i + 2}: falta el nombre`); continue; }
      const email = key(row, 'correo', 'email', 'e-mail').toLowerCase() || null;
      if (email && (await this.prisma.member.findFirst({ where: { email } }))) { result.skipped++; continue; }
      const planName = key(row, 'plan', 'membresia', 'membership');
      const plan = planName ? plans.find((p) => p.name.toLowerCase().includes(planName.toLowerCase())) : undefined;
      const genderRaw = key(row, 'genero', 'gender', 'sexo').toUpperCase();
      const gender = genderRaw.startsWith('F') ? 'FEMENINO' : genderRaw.startsWith('M') ? 'MASCULINO' : genderRaw ? 'OTRO' : undefined;
      const birthRaw = key(row, 'nacimiento', 'fecha de nacimiento', 'birthdate', 'birth_date');
      const birthDate = birthRaw && !isNaN(Date.parse(birthRaw)) ? new Date(birthRaw) : undefined;
      const statusRaw = key(row, 'estado', 'status').toUpperCase();
      const status = ['ACTIVE', 'INACTIVE', 'SUSPENDED', 'EXPIRED'].includes(statusRaw) ? statusRaw : statusRaw.startsWith('ACT') ? 'ACTIVE' : statusRaw.startsWith('VENC') ? 'EXPIRED' : 'ACTIVE';
      try {
        seq++;
        await this.prisma.member.create({ data: { code: `M${30824 + seq + 1000}`, firstName, lastName: lastName || '—', email, phone: key(row, 'telefono', 'phone', 'celular', 'movil') || null, gender, birthDate, address: key(row, 'direccion', 'address') || null, planId: plan?.id, status, expiresAt: plan ? new Date(Date.now() + plan.durationDays * 86_400_000) : undefined } });
        result.created++;
      } catch (e: any) { result.errors.push(`Fila ${i + 2}: ${e.message?.split('\n').pop()}`); }
    }
    return result;
  }

  /** Exporta el listado actual a CSV. */
  async exportCsv(query: QueryMembersDto) {
    const { data } = await this.findAll({ ...query, page: 1, limit: 200 } as any);
    const all = await this.prisma.member.findMany({ where: buildWhere(query), include: listInclude, orderBy: { firstName: 'asc' } });
    const rows = (all.length ? all : data).map((m: any) => ({ codigo: m.code, nombre: m.firstName, apellidos: m.lastName, correo: m.email ?? '', telefono: m.phone ?? '', genero: m.gender ?? '', nacimiento: m.birthDate ? m.birthDate.toISOString().slice(0, 10) : '', plan: m.plan?.name ?? '', estado: m.status, ingreso: m.joinDate.toISOString().slice(0, 10), vence: m.expiresAt ? m.expiresAt.toISOString().slice(0, 10) : '', entrenador: m.trainer ? `${m.trainer.firstName} ${m.trainer.lastName}` : '', sede: m.branch?.name ?? '' }));
    const ws = XLSX.utils.json_to_sheet(rows);
    return XLSX.utils.sheet_to_csv(ws);
  }

  importTemplateCsv() {
    return 'nombre,apellidos,correo,telefono,genero,nacimiento,plan,direccion,estado\nPaola,Restrepo Vélez,paola@gmail.com,+57 300 000 0000,F,2001-08-01,Miembro Oro,Calle 24 C 38,ACTIVE\n';
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

function buildWhere(query: QueryMembersDto) {
  const where: any = {};
  if (query.status) where.status = query.status;
  if (query.planId) where.planId = query.planId;
  if (query.trainerId) where.trainerId = query.trainerId;
  if (query.branchId) where.branchId = query.branchId;
  if (query.search) where.OR = ['firstName', 'lastName', 'code', 'email'].map((f) => ({ [f]: { contains: query.search } }));
  return where;
}

function defaultUnit(type: string) {
  switch (type) {
    case 'WEIGHT': return 'kg';
    case 'BODY_FAT': return '%';
    default: return 'cm';
  }
}
