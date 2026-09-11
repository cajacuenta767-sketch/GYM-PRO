import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { addDays, monthKey, startOfDay, startOfMonth } from '../../common/utils';

const MONTHS_ES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  /** Ingresos por mes (últimos N meses): membresías vs tienda. */
  async revenue(months = 12) {
    const now = new Date();
    const from = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1);
    const [payments, sales] = await Promise.all([
      this.prisma.payment.findMany({ where: { status: 'PAID', paidAt: { gte: from } }, select: { amount: true, paidAt: true } }),
      this.prisma.sale.findMany({ where: { createdAt: { gte: from } }, select: { total: true, createdAt: true } }),
    ]);
    const buckets = new Map<string, { month: string; label: string; memberships: number; store: number; total: number }>();
    for (let i = 0; i < months; i++) {
      const d = new Date(from.getFullYear(), from.getMonth() + i, 1);
      buckets.set(monthKey(d), { month: monthKey(d), label: `${MONTHS_ES[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`, memberships: 0, store: 0, total: 0 });
    }
    for (const p of payments) { const b = buckets.get(monthKey(p.paidAt)); if (b) { b.memberships += p.amount; b.total += p.amount; } }
    for (const s of sales) { const b = buckets.get(monthKey(s.createdAt)); if (b) { b.store += s.total; b.total += s.total; } }
    const series = [...buckets.values()].map((b) => ({ ...b, memberships: round(b.memberships), store: round(b.store), total: round(b.total) }));
    const total = round(series.reduce((a, b) => a + b.total, 0));
    return { series, total, average: round(total / months) };
  }

  /** Altas de miembros por mes y distribución por estado / plan / género. */
  async members(months = 12) {
    const now = new Date();
    const from = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1);
    const [joins, byStatus, byPlan, byGender, plans] = await Promise.all([
      this.prisma.member.findMany({ where: { joinDate: { gte: from } }, select: { joinDate: true } }),
      this.prisma.member.groupBy({ by: ['status'], _count: true }),
      this.prisma.member.groupBy({ by: ['planId'], _count: true }),
      this.prisma.member.groupBy({ by: ['gender'], _count: true }),
      this.prisma.membershipPlan.findMany({ select: { id: true, name: true, color: true } }),
    ]);
    const buckets = new Map<string, { label: string; count: number }>();
    for (let i = 0; i < months; i++) {
      const d = new Date(from.getFullYear(), from.getMonth() + i, 1);
      buckets.set(monthKey(d), { label: `${MONTHS_ES[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`, count: 0 });
    }
    joins.forEach((j) => { const b = buckets.get(monthKey(j.joinDate)); if (b) b.count++; });
    return {
      growth: [...buckets.values()],
      byStatus: byStatus.map((s) => ({ status: s.status, count: s._count })),
      byPlan: byPlan.map((p) => ({ plan: plans.find((x) => x.id === p.planId)?.name ?? 'Sin plan', color: plans.find((x) => x.id === p.planId)?.color ?? '#94A3B8', count: p._count })),
      byGender: byGender.map((g) => ({ gender: g.gender ?? 'N/D', count: g._count })),
    };
  }

  /** Asistencia: por día (últimos 30), por hora y por día de la semana. */
  async attendance(days = 30) {
    const now = new Date();
    const from = startOfDay(addDays(now, -(days - 1)));
    const rows = await this.prisma.attendance.findMany({ where: { checkIn: { gte: from } }, select: { checkIn: true, checkOut: true } });
    const daily = new Map<string, number>();
    for (let i = 0; i < days; i++) daily.set(startOfDay(addDays(from, i)).toISOString().slice(0, 10), 0);
    const byHour = Array.from({ length: 24 }, (_, h) => ({ hour: `${String(h).padStart(2, '0')}:00`, count: 0 }));
    const byWeekday = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map((d) => ({ day: d, count: 0 }));
    let totalMinutes = 0, withCheckout = 0;
    for (const r of rows) {
      const key = startOfDay(r.checkIn).toISOString().slice(0, 10);
      if (daily.has(key)) daily.set(key, (daily.get(key) ?? 0) + 1);
      byHour[r.checkIn.getHours()].count++;
      byWeekday[r.checkIn.getDay()].count++;
      if (r.checkOut) { totalMinutes += (r.checkOut.getTime() - r.checkIn.getTime()) / 60000; withCheckout++; }
    }
    return {
      daily: [...daily.entries()].map(([date, count]) => ({ date, count })),
      byHour: byHour.filter((h) => Number(h.hour.slice(0, 2)) >= 5),
      byWeekday,
      total: rows.length,
      dailyAverage: round(rows.length / days),
      averageStayMinutes: withCheckout ? Math.round(totalMinutes / withCheckout) : 0,
    };
  }

  /** Top clases por reservas y ocupación. */
  async classes() {
    const classes = await this.prisma.gymClass.findMany({
      include: { _count: { select: { bookings: true, members: true } }, trainer: { select: { firstName: true, lastName: true } } },
    });
    return classes
      .map((c) => ({ id: c.id, name: c.name, color: c.color, trainer: c.trainer ? `${c.trainer.firstName} ${c.trainer.lastName}` : null, bookings: c._count.bookings, enrolled: c._count.members, capacity: c.capacity, occupancy: Math.min(100, Math.round((c._count.members / c.capacity) * 100)) }))
      .sort((a, b) => b.bookings - a.bookings);
  }

  /** Productos más vendidos. */
  async store() {
    const items = await this.prisma.saleItem.groupBy({ by: ['productId'], _sum: { quantity: true, total: true }, orderBy: { _sum: { total: 'desc' } }, take: 10 });
    const products = await this.prisma.product.findMany({ where: { id: { in: items.map((i) => i.productId) } }, select: { id: true, name: true, stock: true } });
    return items.map((i) => ({ product: products.find((p) => p.id === i.productId)?.name ?? '—', stock: products.find((p) => p.id === i.productId)?.stock ?? 0, quantity: i._sum.quantity ?? 0, total: round(i._sum.total ?? 0) }));
  }

  /** Caja del día: cobros de membresías y ventas de tienda por método de pago. */
  async cash(dateStr?: string) {
    const day = dateStr ? new Date(`${dateStr}T12:00:00`) : new Date();
    const from = startOfDay(day), to = new Date(from.getTime() + 86_400_000 - 1);
    const [payments, sales] = await Promise.all([
      this.prisma.payment.findMany({ where: { status: 'PAID', paidAt: { gte: from, lte: to } }, include: { member: { select: { firstName: true, lastName: true, code: true } } }, orderBy: { paidAt: 'asc' } }),
      this.prisma.sale.findMany({ where: { createdAt: { gte: from, lte: to } }, include: { member: { select: { firstName: true, lastName: true } }, items: { include: { product: { select: { name: true } } } } }, orderBy: { createdAt: 'asc' } }),
    ]);
    const byMethod: Record<string, { memberships: number; store: number }> = {};
    for (const p of payments) { byMethod[p.method] ??= { memberships: 0, store: 0 }; byMethod[p.method].memberships += p.amount; }
    for (const s of sales) { byMethod[s.paymentMethod] ??= { memberships: 0, store: 0 }; byMethod[s.paymentMethod].store += s.total; }
    const memberships = round(payments.reduce((a, p) => a + p.amount, 0));
    const store = round(sales.reduce((a, s) => a + s.total, 0));
    return {
      date: from.toISOString().slice(0, 10), memberships, store, total: round(memberships + store), count: payments.length + sales.length,
      byMethod: Object.entries(byMethod).map(([method, v]) => ({ method, memberships: round(v.memberships), store: round(v.store), total: round(v.memberships + v.store) })),
      movements: [
        ...payments.map((p) => ({ at: p.paidAt, kind: 'PAYMENT', ref: p.invoiceNumber, who: `${p.member.firstName} ${p.member.lastName}`, concept: p.concept, method: p.method, amount: p.amount })),
        ...sales.map((s) => ({ at: s.createdAt, kind: 'SALE', ref: s.number, who: s.member ? `${s.member.firstName} ${s.member.lastName}` : 'Público', concept: s.items.map((i) => `${i.quantity}× ${i.product.name}`).join(', '), method: s.paymentMethod, amount: s.total })),
      ].sort((a, b) => a.at.getTime() - b.at.getTime()),
    };
  }

  /** Resumen ejecutivo para la cabecera de reportes. */
  async summary() {
    const now = new Date();
    const monthStart = startOfMonth(now);
    const [members, activeMembers, revenueMonth, attendanceMonth, expiring] = await Promise.all([
      this.prisma.member.count(),
      this.prisma.member.count({ where: { status: 'ACTIVE' } }),
      this.prisma.payment.aggregate({ _sum: { amount: true }, where: { status: 'PAID', paidAt: { gte: monthStart } } }),
      this.prisma.attendance.count({ where: { checkIn: { gte: monthStart } } }),
      this.prisma.member.count({ where: { status: 'ACTIVE', expiresAt: { gte: now, lte: addDays(now, 30) } } }),
    ]);
    return { members, activeMembers, retention: members ? Math.round((activeMembers / members) * 100) : 0, revenueMonth: round(revenueMonth._sum.amount ?? 0), attendanceMonth, expiring30: expiring };
  }
}

const round = (n: number) => Math.round(n * 100) / 100;
