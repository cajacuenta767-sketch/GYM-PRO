import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../../database/prisma.service';
import { PaginationDto } from '../../common/dto';
import { addDays, paginate, startOfDay } from '../../common/utils';
import { MailService } from './mail.service';
import { templates } from './templates';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger('Notifications');
  constructor(private prisma: PrismaService, private mail: MailService) {}

  // ── In-app ──
  list(target: { userId?: string; memberId?: string }, query: PaginationDto & { unread?: string }) {
    const where: any = target.memberId ? { memberId: target.memberId } : { userId: target.userId };
    if (query.unread === 'true') where.readAt = null;
    return paginate(this.prisma.notification, query, { where, defaultSort: { createdAt: 'desc' }, sortable: ['createdAt'] });
  }

  async unreadCount(target: { userId?: string; memberId?: string }) {
    const where: any = target.memberId ? { memberId: target.memberId } : { userId: target.userId };
    return { count: await this.prisma.notification.count({ where: { ...where, readAt: null } }) };
  }

  markRead(target: { userId?: string; memberId?: string }, id: string) {
    const where: any = target.memberId ? { memberId: target.memberId } : { userId: target.userId };
    return this.prisma.notification.update({ where: { id, ...where }, data: { readAt: new Date() } });
  }

  async markAllRead(target: { userId?: string; memberId?: string }) {
    const where: any = target.memberId ? { memberId: target.memberId } : { userId: target.userId };
    await this.prisma.notification.updateMany({ where: { ...where, readAt: null }, data: { readAt: new Date() } });
    return { ok: true };
  }

  notifyUser(userId: string, data: { type?: string; title: string; body: string; link?: string }) {
    return this.prisma.notification.create({ data: { userId, ...data } });
  }

  notifyMember(memberId: string, data: { type?: string; title: string; body: string; link?: string }) {
    return this.prisma.notification.create({ data: { memberId, ...data } });
  }

  /** Notifica a todos los usuarios de un tipo de cuenta (p. ej. ADMIN, STAFF). */
  async notifyRole(roles: string[], data: { type?: string; title: string; body: string; link?: string }) {
    const users = await this.prisma.user.findMany({ where: { role: { in: roles }, isActive: true }, select: { id: true } });
    if (!users.length) return { count: 0 };
    await this.prisma.notification.createMany({ data: users.map((u) => ({ userId: u.id, ...data })) });
    return { count: users.length };
  }

  logs(query: PaginationDto) {
    return paginate(this.prisma.notificationLog, query, { searchFields: ['recipient', 'subject', 'template'], sortable: ['createdAt', 'status', 'channel'], defaultSort: { createdAt: 'desc' } });
  }

  // ── Correo ──
  private async gymName() {
    return (await this.prisma.setting.findUnique({ where: { key: 'gymName' } }))?.value ?? 'GYM PRO';
  }
  private portalUrl() {
    return `${process.env.WEB_URL ?? 'http://localhost:5173'}/portal`;
  }
  private async setting(key: string, fallback: string) {
    return (await this.prisma.setting.findUnique({ where: { key } }))?.value ?? fallback;
  }

  async sendTest(to: string) {
    return this.mail.send({ to, template: 'test', ...templates.test(await this.gymName()) });
  }

  async sendWelcome(memberId: string) {
    const m = await this.prisma.member.findUnique({ where: { id: memberId } });
    if (!m?.email || (await this.setting('notifyNewMember', 'true')) !== 'true') return;
    const t = templates.welcome(await this.gymName(), m.firstName, m.code, this.portalUrl());
    await this.mail.send({ to: m.email, template: 'welcome', ...t });
    await this.notifyMember(m.id, { type: 'SYSTEM', title: `¡Bienvenido/a, ${m.firstName}!`, body: 'Tu cuenta del portal está lista. Aquí verás avisos, reservas y recordatorios.' });
  }

  async sendBookingConfirmed(bookingId: string) {
    const b = await this.prisma.booking.findUnique({ where: { id: bookingId }, include: { member: true, class: true } });
    if (!b) return;
    const when = b.date.toLocaleString('es-CO', { dateStyle: 'full', timeStyle: 'short' });
    await this.notifyMember(b.memberId, { type: 'BOOKING', title: b.status === 'WAITLISTED' ? `En lista de espera: ${b.class.name}` : `Reserva confirmada: ${b.class.name}`, body: when, link: '/portal/reservas' });
    if (b.member.email && b.status === 'CONFIRMED') {
      await this.mail.send({ to: b.member.email, template: 'bookingConfirmed', ...templates.bookingConfirmed(await this.gymName(), b.member.firstName, b.class.name, when, b.class.location ?? 'el gimnasio') });
    }
  }

  async sendWaitlistPromoted(bookingId: string) {
    const b = await this.prisma.booking.findUnique({ where: { id: bookingId }, include: { member: true, class: true } });
    if (!b) return;
    const when = b.date.toLocaleString('es-CO', { dateStyle: 'full', timeStyle: 'short' });
    await this.notifyMember(b.memberId, { type: 'BOOKING', title: `¡Cupo liberado en ${b.class.name}!`, body: `Tu reserva del ${when} quedó confirmada.`, link: '/portal/reservas' });
    if (b.member.email) await this.mail.send({ to: b.member.email, template: 'waitlistPromoted', ...templates.waitlistPromoted(await this.gymName(), b.member.firstName, b.class.name, when) });
  }

  async sendPaymentReceived(paymentId: string) {
    const p = await this.prisma.payment.findUnique({ where: { id: paymentId }, include: { member: true } });
    if (!p || p.status !== 'PAID') return;
    const symbol = await this.setting('currencySymbol', '$');
    await this.notifyMember(p.memberId, { type: 'PAYMENT', title: 'Pago recibido', body: `${p.concept} · ${symbol}${p.amount}`, link: '/portal/pagos' });
    if (p.member.email) await this.mail.send({ to: p.member.email, template: 'paymentReceived', ...templates.paymentReceived(await this.gymName(), p.member.firstName, p.concept, `${symbol}${p.amount}`, p.invoiceNumber) });
  }

  // ── Tareas programadas ──
  /** Cada día a las 08:00: vencimientos próximos, cumpleaños y stock bajo. */
  @Cron('0 8 * * *')
  async runDaily() {
    const gym = await this.gymName();
    const now = new Date();
    const result = { expired: 0, unfrozen: 0, expiring: 0, birthdays: 0, lowStock: 0 };

    // Vencimientos: miembros activos con fecha pasada (y no congelados) pasan a EXPIRED; igual las suscripciones
    const expiredMembers = await this.prisma.member.updateMany({ where: { status: 'ACTIVE', expiresAt: { lt: startOfDay(now) }, OR: [{ frozenUntil: null }, { frozenUntil: { lt: now } }] }, data: { status: 'EXPIRED' } });
    await this.prisma.subscription.updateMany({ where: { status: 'ACTIVE', endDate: { lt: startOfDay(now) } }, data: { status: 'EXPIRED' } });
    result.expired = expiredMembers.count;
    const unfrozen = await this.prisma.member.updateMany({ where: { frozenUntil: { lt: now } }, data: { frozenUntil: null } });
    result.unfrozen = unfrozen.count;

    if ((await this.setting('notifyExpiring', 'true')) === 'true') {
      const days = Number(await this.setting('expiringDays', '7'));
      const members = await this.prisma.member.findMany({ where: { status: 'ACTIVE', expiresAt: { gte: startOfDay(now), lte: addDays(startOfDay(now), days) } }, include: { plan: true } });
      for (const m of members) {
        const left = Math.ceil((m.expiresAt!.getTime() - now.getTime()) / 86_400_000);
        const already = await this.prisma.notification.findFirst({ where: { memberId: m.id, type: 'EXPIRING', createdAt: { gte: addDays(now, -3) } } });
        if (already) continue;
        await this.notifyMember(m.id, { type: 'EXPIRING', title: `Tu membresía vence en ${left} día${left === 1 ? '' : 's'}`, body: `Plan ${m.plan?.name ?? ''} · ${m.expiresAt!.toLocaleDateString('es-CO')}`, link: '/portal/pagos' });
        if (m.email) await this.mail.send({ to: m.email, template: 'expiring', ...templates.expiring(gym, m.firstName, m.plan?.name ?? 'actual', m.expiresAt!.toLocaleDateString('es-CO'), left, this.portalUrl()) });
        result.expiring++;
      }
      if (members.length) await this.notifyRole(['ADMIN', 'STAFF'], { type: 'EXPIRING', title: `${members.length} membresías vencen en ${days} días`, body: 'Revisa la lista de renovaciones pendientes.', link: '/suscripciones' });
    }

    if ((await this.setting('notifyBirthday', 'true')) === 'true') {
      const members = await this.prisma.member.findMany({ where: { status: 'ACTIVE', birthDate: { not: null } } });
      for (const m of members.filter((x) => x.birthDate!.getDate() === now.getDate() && x.birthDate!.getMonth() === now.getMonth())) {
        await this.notifyMember(m.id, { type: 'BIRTHDAY', title: `¡Feliz cumpleaños, ${m.firstName}! 🎉`, body: 'Pasa por recepción, tenemos una sorpresa para ti.' });
        if (m.email) await this.mail.send({ to: m.email, template: 'birthday', ...templates.birthday(gym, m.firstName) });
        result.birthdays++;
      }
    }

    const products = await this.prisma.product.findMany({ where: { isActive: true } });
    const low = products.filter((p) => p.stock <= p.minStock);
    if (low.length) {
      await this.notifyRole(['ADMIN', 'ACCOUNTANT'], { type: 'STOCK', title: `${low.length} productos con stock bajo`, body: low.slice(0, 4).map((p) => `${p.name} (${p.stock})`).join(', '), link: '/tienda' });
      result.lowStock = low.length;
    }
    this.logger.log(`Tarea diaria: ${JSON.stringify(result)}`);
    return result;
  }
}
