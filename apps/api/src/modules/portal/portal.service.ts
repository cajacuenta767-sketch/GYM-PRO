import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { addDays, startOfDay, startOfMonth } from '../../common/utils';
import { ClassesService } from '../classes/classes.service';
import { BookingsService } from '../bookings/bookings.service';
import { NutritionService } from '../nutrition/nutrition.service';
import { RoutinesService } from '../routines/routines.service';
import { PaymentsService } from '../payments/payments.service';
import { PortalBookingDto, PortalMeasurementDto, PortalProfileDto } from './dto/portal.dto';

/** Todo lo que un socio puede ver y hacer sobre sí mismo. */
@Injectable()
export class PortalService {
  constructor(
    private prisma: PrismaService,
    private classes: ClassesService,
    private bookings: BookingsService,
    private nutrition: NutritionService,
    private routines: RoutinesService,
    private paymentsService: PaymentsService,
  ) {}

  private async member(memberId?: string | null) {
    if (!memberId) throw new ForbiddenException('Esta cuenta no está vinculada a un miembro');
    const m = await this.prisma.member.findUnique({ where: { id: memberId }, include: { plan: true, trainer: { select: { id: true, firstName: true, lastName: true, photoUrl: true, specialty: true, phone: true } }, branch: { select: { id: true, name: true, address: true } } } });
    if (!m) throw new NotFoundException('Miembro no encontrado');
    return m;
  }

  async home(memberId?: string | null) {
    const m = await this.member(memberId);
    const now = new Date();
    const [visitsMonth, visitsTotal, nextBooking, lastPayment, notices, unread, activeSub, events, lastWeight] = await Promise.all([
      this.prisma.attendance.count({ where: { memberId: m.id, checkIn: { gte: startOfMonth(now) } } }),
      this.prisma.attendance.count({ where: { memberId: m.id } }),
      this.prisma.booking.findFirst({ where: { memberId: m.id, date: { gte: now }, status: { in: ['CONFIRMED', 'WAITLISTED'] } }, include: { class: { select: { name: true, color: true, location: true } } }, orderBy: { date: 'asc' } }),
      this.prisma.payment.findFirst({ where: { memberId: m.id, status: 'PAID' }, orderBy: { paidAt: 'desc' } }),
      this.prisma.notice.findMany({ where: { startsAt: { lte: now }, OR: [{ endsAt: null }, { endsAt: { gte: now } }], audience: { in: ['ALL', 'MEMBERS', 'ACTIVE_MEMBERS'] } }, orderBy: [{ isPinned: 'desc' }, { startsAt: 'desc' }], take: 4 }),
      this.prisma.notification.count({ where: { memberId: m.id, readAt: null } }),
      this.prisma.subscription.findFirst({ where: { memberId: m.id, status: 'ACTIVE' }, include: { plan: { select: { name: true, color: true, durationDays: true } } }, orderBy: { endDate: 'desc' } }),
      this.prisma.event.findMany({ where: { isPublic: true, startsAt: { gte: startOfDay(now) } }, orderBy: { startsAt: 'asc' }, take: 3 }),
      this.prisma.measurement.findFirst({ where: { memberId: m.id, type: 'WEIGHT' }, orderBy: { measuredAt: 'desc' } }),
    ]);
    const daysLeft = m.expiresAt ? Math.ceil((m.expiresAt.getTime() - now.getTime()) / 86_400_000) : null;
    const { userId: _u, notes: _n, ...profile } = m as any;
    return {
      member: profile,
      membership: { plan: m.plan, expiresAt: m.expiresAt, daysLeft, status: m.status, frozenUntil: m.frozenUntil, subscription: activeSub, progress: activeSub ? Math.min(100, Math.round(((now.getTime() - activeSub.startDate.getTime()) / (activeSub.endDate.getTime() - activeSub.startDate.getTime())) * 100)) : null },
      stats: { visitsMonth, visitsTotal, lastWeight: lastWeight?.value ?? null, unread },
      nextBooking, lastPayment, notices, events,
    };
  }

  async updateProfile(memberId: string | null | undefined, dto: PortalProfileDto) {
    const m = await this.member(memberId);
    return this.prisma.member.update({ where: { id: m.id }, data: dto, select: { id: true, phone: true, address: true, emergencyContact: true, interestArea: true, photoUrl: true } });
  }

  weekly() { return this.classes.weekly(); }

  async myBookings(memberId?: string | null) {
    const m = await this.member(memberId);
    const rows = await this.prisma.booking.findMany({ where: { memberId: m.id }, include: { class: { select: { id: true, name: true, color: true, location: true, trainer: { select: { firstName: true, lastName: true } } } } }, orderBy: { date: 'desc' }, take: 40 });
    const now = new Date();
    return { upcoming: rows.filter((r) => r.date >= now && r.status !== 'CANCELLED').reverse(), past: rows.filter((r) => r.date < now || r.status === 'CANCELLED') };
  }

  async book(memberId: string | null | undefined, dto: PortalBookingDto) {
    const m = await this.member(memberId);
    if (m.status !== 'ACTIVE') throw new ForbiddenException('Tu membresía no está activa. Renueva para reservar clases.');
    if (m.frozenUntil && m.frozenUntil > new Date()) throw new ForbiddenException('Tu membresía está congelada.');
    return this.bookings.create({ memberId: m.id, classId: dto.classId, scheduleId: dto.scheduleId, date: dto.date, paid: true, waitlist: dto.waitlist ?? true });
  }

  async cancelBooking(memberId: string | null | undefined, id: string) {
    const m = await this.member(memberId);
    const b = await this.prisma.booking.findFirst({ where: { id, memberId: m.id } });
    if (!b) throw new NotFoundException('Reserva no encontrada');
    return this.bookings.cancel(id);
  }

  async nutritionPlan(memberId?: string | null) { const m = await this.member(memberId); return this.nutrition.weeklyPlan(m.id); }
  async routine(memberId?: string | null) { const m = await this.member(memberId); return this.routines.activeForMember(m.id); }

  async measurements(memberId?: string | null) {
    const m = await this.member(memberId);
    return this.prisma.measurement.findMany({ where: { memberId: m.id }, orderBy: { measuredAt: 'asc' } });
  }
  async addMeasurement(memberId: string | null | undefined, dto: PortalMeasurementDto) {
    const m = await this.member(memberId);
    return this.prisma.measurement.create({ data: { memberId: m.id, type: dto.type, value: dto.value, unit: dto.type === 'WEIGHT' ? 'kg' : 'cm', note: dto.note ?? 'Registrado por el miembro' } });
  }

  async payments(memberId?: string | null) {
    const m = await this.member(memberId);
    const [rows, subs] = await Promise.all([
      this.prisma.payment.findMany({ where: { memberId: m.id }, orderBy: { paidAt: 'desc' }, take: 30 }),
      this.prisma.subscription.findMany({ where: { memberId: m.id }, include: { plan: { select: { name: true, color: true } } }, orderBy: { startDate: 'desc' }, take: 10 }),
    ]);
    return { payments: rows, subscriptions: subs };
  }

  async attendance(memberId?: string | null) {
    const m = await this.member(memberId);
    const rows = await this.prisma.attendance.findMany({ where: { memberId: m.id, checkIn: { gte: addDays(new Date(), -60) } }, orderBy: { checkIn: 'desc' } });
    const byWeek: Record<string, number> = {};
    for (const r of rows) { const d = startOfDay(r.checkIn); const monday = addDays(d, -((d.getDay() + 6) % 7)); const k = monday.toISOString().slice(0, 10); byWeek[k] = (byWeek[k] ?? 0) + 1; }
    return { rows: rows.slice(0, 30), byWeek: Object.entries(byWeek).sort().map(([week, count]) => ({ week, count })) };
  }

  plans() { return this.prisma.membershipPlan.findMany({ where: { isActive: true }, orderBy: { price: 'asc' } }).then((ps) => ps.map((p) => ({ ...p, benefits: safe(p.benefits) }))); }

  async checkout(memberId: string | null | undefined, planId: string) {
    const m = await this.member(memberId);
    return this.paymentsService.createCheckout({ memberId: m.id, planId });
  }

  async events(memberId?: string | null) {
    const m = await this.member(memberId);
    const rows = await this.prisma.event.findMany({ where: { isPublic: true, startsAt: { gte: startOfDay(new Date()) } }, include: { rsvps: { where: { memberId: m.id } }, _count: { select: { rsvps: true } } }, orderBy: { startsAt: 'asc' } });
    return rows.map((e) => ({ ...e, myStatus: e.rsvps[0]?.status ?? null, rsvps: undefined }));
  }
  async rsvp(memberId: string | null | undefined, eventId: string, status = 'GOING') {
    const m = await this.member(memberId);
    return this.prisma.eventRsvp.upsert({ where: { eventId_memberId: { eventId, memberId: m.id } }, create: { eventId, memberId: m.id, status }, update: { status } });
  }
}

function safe(v: string) { try { return JSON.parse(v); } catch { return []; } }
