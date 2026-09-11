import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Member } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { addDays, endOfDay, paginate, startOfDay } from '../../common/utils';
import { CheckInDto, ManualAttendanceDto, QueryAttendanceDto } from './dto/attendance.dto';

const include = {
  member: { select: { id: true, code: true, firstName: true, lastName: true, photoUrl: true, status: true, expiresAt: true, plan: { select: { name: true, color: true } } } },
};

@Injectable()
export class AttendanceService {
  constructor(private prisma: PrismaService) {}

  findAll(query: QueryAttendanceDto) {
    const where: any = {};
    if (query.memberId) where.memberId = query.memberId;
    if (query.method) where.method = query.method;
    if (query.from || query.to) {
      where.checkIn = {};
      if (query.from) where.checkIn.gte = startOfDay(new Date(query.from));
      if (query.to) where.checkIn.lte = endOfDay(new Date(query.to));
    }
    return paginate(this.prisma.attendance, query, {
      where,
      include,
      searchFields: ['member.firstName', 'member.lastName', 'member.code'],
      sortable: ['checkIn', 'checkOut', 'method'],
      defaultSort: { checkIn: 'desc' },
    });
  }

  /** Registro de entrada (QR, código o id). Valida membresía y evita duplicados abiertos. */
  async checkIn(dto: CheckInDto) {
    const member = await this.resolveMember(dto);
    const now = new Date();

    const frozen = !!member.frozenUntil && member.frozenUntil > now;
    const allowed = member.status === 'ACTIVE' && !frozen && (!member.expiresAt || member.expiresAt >= startOfDay(now));
    await this.prisma.accessLog.create({
      data: {
        memberId: member.id,
        method: dto.method ?? 'QR',
        allowed,
        reason: allowed ? null : frozen ? 'Membresía congelada' : member.status !== 'ACTIVE' ? `Miembro ${member.status}` : 'Membresía vencida',
        gate: 'Entrada principal',
      },
    });
    if (!allowed) {
      throw new BadRequestException(
        frozen ? `Acceso denegado: la membresía está congelada hasta el ${member.frozenUntil!.toLocaleDateString('es-CO')}` : member.status !== 'ACTIVE' ? `Acceso denegado: el miembro está ${member.status.toLowerCase()}` : 'Acceso denegado: la membresía está vencida',
      );
    }

    const open = await this.prisma.attendance.findFirst({
      where: { memberId: member.id, checkOut: null, checkIn: { gte: startOfDay(now) } },
    });
    if (open) {
      // Segunda lectura del día = salida
      const closed = await this.prisma.attendance.update({ where: { id: open.id }, data: { checkOut: now }, include });
      return { action: 'CHECK_OUT', attendance: closed };
    }

    const created = await this.prisma.attendance.create({
      data: { memberId: member.id, method: dto.method ?? 'QR', note: dto.note, checkIn: now },
      include,
    });
    return { action: 'CHECK_IN', attendance: created };
  }

  createManual(dto: ManualAttendanceDto) {
    return this.prisma.attendance.create({
      data: { memberId: dto.memberId, method: 'MANUAL', checkIn: new Date(dto.checkIn), checkOut: dto.checkOut ? new Date(dto.checkOut) : undefined, note: dto.note },
      include,
    });
  }

  checkOut(id: string) {
    return this.prisma.attendance.update({ where: { id }, data: { checkOut: new Date() }, include });
  }

  remove(id: string) { return this.prisma.attendance.delete({ where: { id }, select: { id: true } }); }

  async today() {
    const now = new Date();
    const rows = await this.prisma.attendance.findMany({
      where: { checkIn: { gte: startOfDay(now), lte: endOfDay(now) } },
      include,
      orderBy: { checkIn: 'desc' },
    });
    const inside = rows.filter((r) => !r.checkOut).length;
    const byHour = Array.from({ length: 24 }, (_, h) => ({ hour: h, count: 0 }));
    rows.forEach((r) => byHour[r.checkIn.getHours()].count++);
    return { total: rows.length, inside, byHour: byHour.filter((b) => b.hour >= 5 && b.hour <= 23), rows };
  }

  async stats() {
    const now = new Date();
    const last7 = await this.prisma.attendance.findMany({ where: { checkIn: { gte: startOfDay(addDays(now, -6)) } }, select: { checkIn: true } });
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = startOfDay(addDays(now, i - 6));
      return { date: d.toISOString().slice(0, 10), count: 0 };
    });
    for (const r of last7) {
      const key = startOfDay(r.checkIn).toISOString().slice(0, 10);
      const day = days.find((d) => d.date === key);
      if (day) day.count++;
    }
    const [today, month] = await Promise.all([
      this.prisma.attendance.count({ where: { checkIn: { gte: startOfDay(now) } } }),
      this.prisma.attendance.count({ where: { checkIn: { gte: new Date(now.getFullYear(), now.getMonth(), 1) } } }),
    ]);
    return { today, month, last7Days: days, dailyAverage: Math.round(last7.length / 7) };
  }

  private async resolveMember(dto: CheckInDto) {
    let member: Member | null = null;
    if (dto.memberId) member = await this.prisma.member.findUnique({ where: { id: dto.memberId } });
    else if (dto.qrToken) member = await this.prisma.member.findUnique({ where: { qrToken: dto.qrToken } });
    else if (dto.code) member = await this.prisma.member.findUnique({ where: { code: dto.code } });
    if (!member) throw new NotFoundException('No se encontró el miembro');
    return member;
  }
}
