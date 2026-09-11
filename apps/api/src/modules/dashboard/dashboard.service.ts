import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { addDays, endOfDay, startOfDay, startOfMonth } from '../../common/utils';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async overview() {
    const now = new Date();
    const monthStart = startOfMonth(now);
    const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const [
      members, activeMembers, newMembersMonth, newMembersPrev, staff, groups, classes,
      revenueMonth, revenuePrev, attendanceToday, insideNow, expiringSoon, pendingPayments,
      bookingsToday, plans, groupList, notices, upcomingEvents, recentPayments, lowStock, unreadMessages,
    ] = await Promise.all([
      this.prisma.member.count(),
      this.prisma.member.count({ where: { status: 'ACTIVE' } }),
      this.prisma.member.count({ where: { joinDate: { gte: monthStart } } }),
      this.prisma.member.count({ where: { joinDate: { gte: prevMonthStart, lt: monthStart } } }),
      this.prisma.staff.count({ where: { isActive: true } }),
      this.prisma.group.count(),
      this.prisma.gymClass.count({ where: { isActive: true } }),
      this.prisma.payment.aggregate({ _sum: { amount: true }, where: { status: 'PAID', paidAt: { gte: monthStart } } }),
      this.prisma.payment.aggregate({ _sum: { amount: true }, where: { status: 'PAID', paidAt: { gte: prevMonthStart, lt: monthStart } } }),
      this.prisma.attendance.count({ where: { checkIn: { gte: startOfDay(now) } } }),
      this.prisma.attendance.count({ where: { checkIn: { gte: startOfDay(now) }, checkOut: null } }),
      this.prisma.member.findMany({
        where: { status: 'ACTIVE', expiresAt: { gte: startOfDay(now), lte: addDays(now, 7) } },
        select: { id: true, code: true, firstName: true, lastName: true, photoUrl: true, expiresAt: true, plan: { select: { name: true, color: true } } },
        orderBy: { expiresAt: 'asc' }, take: 6,
      }),
      this.prisma.payment.aggregate({ _sum: { amount: true }, _count: true, where: { status: 'PENDING' } }),
      this.prisma.booking.count({ where: { date: { gte: startOfDay(now), lte: endOfDay(now) }, status: { not: 'CANCELLED' } } }),
      this.prisma.membershipPlan.findMany({ where: { isActive: true }, include: { _count: { select: { members: true } } }, orderBy: { price: 'desc' } }),
      this.prisma.group.findMany({ include: { _count: { select: { members: true } } }, orderBy: { name: 'asc' }, take: 6 }),
      this.prisma.notice.findMany({ where: { startsAt: { lte: now }, OR: [{ endsAt: null }, { endsAt: { gte: now } }] }, orderBy: [{ isPinned: 'desc' }, { startsAt: 'desc' }], take: 4 }),
      this.prisma.event.findMany({ where: { startsAt: { gte: startOfDay(now) } }, orderBy: { startsAt: 'asc' }, take: 4 }),
      this.prisma.payment.findMany({ where: { status: 'PAID' }, include: { member: { select: { firstName: true, lastName: true, photoUrl: true, code: true } } }, orderBy: { paidAt: 'desc' }, take: 6 }),
      this.prisma.product.findMany({ where: { isActive: true }, select: { id: true, name: true, stock: true, minStock: true } }),
      Promise.resolve(0),
    ]);

    const rev = revenueMonth._sum.amount ?? 0;
    const revPrev = revenuePrev._sum.amount ?? 0;

    // Asistencia últimos 14 días
    const from = startOfDay(addDays(now, -13));
    const att = await this.prisma.attendance.findMany({ where: { checkIn: { gte: from } }, select: { checkIn: true } });
    const attendanceSeries = Array.from({ length: 14 }, (_, i) => {
      const d = startOfDay(addDays(from, i));
      return { date: d.toISOString().slice(0, 10), label: `${d.getDate()}/${d.getMonth() + 1}`, count: 0 };
    });
    att.forEach((a) => { const k = startOfDay(a.checkIn).toISOString().slice(0, 10); const s = attendanceSeries.find((x) => x.date === k); if (s) s.count++; });

    return {
      kpis: {
        members: { value: members, active: activeMembers, newThisMonth: newMembersMonth, trend: pct(newMembersMonth, newMembersPrev) },
        staff: { value: staff },
        groups: { value: groups },
        classes: { value: classes },
        revenue: { value: rev, prev: revPrev, trend: pct(rev, revPrev) },
        attendanceToday: { value: attendanceToday, inside: insideNow },
        bookingsToday: { value: bookingsToday },
        pending: { value: pendingPayments._sum.amount ?? 0, count: pendingPayments._count },
        unreadMessages,
      },
      plans: plans.map((p) => ({ id: p.id, name: p.name, color: p.color, price: p.price, durationDays: p.durationDays, members: p._count.members })),
      groups: groupList.map((g) => ({ id: g.id, name: g.name, color: g.color, imageUrl: g.imageUrl, members: g._count.members })),
      expiringSoon,
      notices,
      upcomingEvents,
      recentPayments,
      lowStock: lowStock.filter((p) => p.stock <= p.minStock).slice(0, 5),
      attendanceSeries,
    };
  }

  /** Eventos de calendario: eventos, cumpleaños y clases del rango. */
  async calendar(fromStr?: string, toStr?: string) {
    const now = new Date();
    const from = fromStr ? new Date(fromStr) : startOfMonth(now);
    const to = toStr ? new Date(toStr) : new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const [events, members, schedules] = await Promise.all([
      this.prisma.event.findMany({ where: { startsAt: { gte: from, lte: to } } }),
      this.prisma.member.findMany({ where: { birthDate: { not: null }, status: 'ACTIVE' }, select: { id: true, firstName: true, lastName: true, birthDate: true } }),
      this.prisma.classSchedule.findMany({ where: { class: { isActive: true } }, include: { class: { select: { id: true, name: true, color: true } } } }),
    ]);

    const items: any[] = events.map((e) => ({ id: e.id, type: 'event', title: e.title, date: e.startsAt, end: e.endsAt, color: e.color, allDay: false }));

    for (const m of members) {
      const b = m.birthDate!;
      for (const year of [from.getFullYear(), to.getFullYear()]) {
        const d = new Date(year, b.getMonth(), b.getDate());
        if (d >= from && d <= to) items.push({ id: `bday-${m.id}-${year}`, type: 'birthday', title: `Cumpleaños de ${m.firstName}`, date: d, color: '#F59E0B', allDay: true, memberId: m.id });
      }
    }

    for (let d = new Date(from); d <= to; d = addDays(d, 1)) {
      for (const s of schedules.filter((x) => x.dayOfWeek === d.getDay())) {
        const [h, mi] = s.startTime.split(':').map(Number);
        const date = new Date(d.getFullYear(), d.getMonth(), d.getDate(), h, mi);
        items.push({ id: `cls-${s.id}-${date.toISOString().slice(0, 10)}`, type: 'class', title: s.class.name, date, color: s.class.color, allDay: false, time: s.startTime, endTime: s.endTime, classId: s.class.id });
      }
    }

    return items.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }
}

function pct(curr: number, prev: number) {
  if (!prev) return curr ? 100 : 0;
  return Math.round(((curr - prev) / prev) * 1000) / 10;
}
