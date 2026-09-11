import { BadRequestException, ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { addDays, endOfDay, paginate, sequential, startOfDay, startOfMonth } from '../../common/utils';
import { NotificationsService } from '../notifications/notifications.service';
import { CreatePaymentDto, QueryPaymentsDto, UpdatePaymentDto } from './dto/payment.dto';
import { buildInvoicePdf } from './invoice.pdf';
import { MockPaymentProvider } from './providers/mock.provider';
import { PaymentProvider } from './providers/payment-provider';
import { StripePaymentProvider } from './providers/stripe.provider';

const include = {
  member: { select: { id: true, code: true, firstName: true, lastName: true, photoUrl: true, email: true } },
  subscription: { select: { id: true, startDate: true, endDate: true, plan: { select: { name: true } } } },
};

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger('Payments');
  constructor(private prisma: PrismaService, private notifications: NotificationsService, private stripe: StripePaymentProvider, private mock: MockPaymentProvider) {}

  /** Stripe si hay clave configurada; si no, la pasarela de demostración. */
  private provider(): PaymentProvider {
    return process.env.STRIPE_SECRET_KEY ? this.stripe : this.mock;
  }

  findAll(query: QueryPaymentsDto) {
    const where: any = {};
    if (query.memberId) where.memberId = query.memberId;
    if (query.status) where.status = query.status;
    if (query.method) where.method = query.method;
    if (query.from || query.to) {
      where.paidAt = {};
      if (query.from) where.paidAt.gte = startOfDay(new Date(query.from));
      if (query.to) where.paidAt.lte = endOfDay(new Date(query.to));
    }
    return paginate(this.prisma.payment, query, {
      where, include,
      searchFields: ['invoiceNumber', 'concept', 'reference', 'member.firstName', 'member.lastName', 'member.code'],
      sortable: ['invoiceNumber', 'amount', 'paidAt', 'status', 'method'],
      defaultSort: { paidAt: 'desc' },
    });
  }

  findOne(id: string) { return this.prisma.payment.findUniqueOrThrow({ where: { id }, include }); }

  async create(dto: CreatePaymentDto) {
    const count = await this.prisma.payment.count();
    const payment = await this.prisma.payment.create({
      data: { ...dto, invoiceNumber: sequential('FAC', count + 1), paidAt: dto.paidAt ? new Date(dto.paidAt) : new Date(), dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined },
      include,
    });
    if (payment.status === 'PAID') this.notifications.sendPaymentReceived(payment.id).catch(() => null);
    return payment;
  }

  async update(id: string, dto: UpdatePaymentDto) {
    const before = await this.prisma.payment.findUnique({ where: { id } });
    const payment = await this.prisma.payment.update({
      where: { id },
      data: { ...dto, paidAt: dto.paidAt ? new Date(dto.paidAt) : undefined, dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined },
      include,
    });
    if (before?.status !== 'PAID' && payment.status === 'PAID') this.notifications.sendPaymentReceived(payment.id).catch(() => null);
    return payment;
  }

  remove(id: string) { return this.prisma.payment.delete({ where: { id }, select: { id: true } }); }

  // ── Pago en línea ──
  async createCheckout(input: { memberId: string; planId: string }) {
    const [member, plan, settings] = await Promise.all([
      this.prisma.member.findUniqueOrThrow({ where: { id: input.memberId } }),
      this.prisma.membershipPlan.findUniqueOrThrow({ where: { id: input.planId } }),
      this.prisma.setting.findMany({ where: { key: { in: ['currency', 'gymName'] } } }),
    ]);
    const currency = settings.find((s) => s.key === 'currency')?.value ?? 'USD';
    const count = await this.prisma.payment.count();
    const payment = await this.prisma.payment.create({
      data: { invoiceNumber: sequential('FAC', count + 1), memberId: member.id, concept: `Membresía ${plan.name}`, amount: plan.price, method: 'ONLINE', status: 'PENDING', planId: plan.id, dueDate: addDays(new Date(), 1) },
    });
    const web = process.env.WEB_URL ?? 'http://localhost:5173';
    const result = await this.provider().createCheckout({
      paymentId: payment.id, amount: plan.price, currency, concept: `Membresía ${plan.name} · ${plan.durationDays} días`, customerEmail: member.email,
      successUrl: `${web}/portal/pago/exito?ref={CHECKOUT_SESSION_ID}`, cancelUrl: `${web}/portal/pagos?cancelado=1`,
    });
    await this.prisma.payment.update({ where: { id: payment.id }, data: { provider: result.provider, providerRef: result.providerRef } });
    return { url: result.url, providerRef: result.providerRef, provider: result.provider, paymentId: payment.id };
  }

  /** Confirma un pago en línea: crea la suscripción y activa al miembro. */
  async confirmCheckout(providerRef: string, source: 'WEBHOOK' | 'RETURN' = 'RETURN', actor?: { role: string; memberId?: string | null }) {
    const payment = await this.prisma.payment.findUnique({ where: { providerRef }, include: { member: true } });
    if (!payment) throw new NotFoundException('Pago no encontrado');
    // Un miembro solo puede confirmar sus propios pagos (se valida ANTES de cualquier cambio)
    if (actor?.role === 'MEMBER' && payment.memberId !== actor.memberId) throw new ForbiddenException('Este pago no pertenece a tu cuenta');
    if (payment.status === 'PAID') return { alreadyPaid: true, payment };
    if (source === 'RETURN') {
      // Al volver de la pasarela se verifica con el proveedor que el cobro exista de verdad
      const provider = payment.provider === 'STRIPE' ? this.stripe : this.mock;
      const paid = await provider.verifyPayment(providerRef);
      if (!paid) return { pending: true, payment };
    }
    if (!payment.planId) throw new BadRequestException('El pago no tiene un plan asociado');
    const plan = await this.prisma.membershipPlan.findUniqueOrThrow({ where: { id: payment.planId } });
    const start = payment.member.expiresAt && payment.member.expiresAt > new Date() ? payment.member.expiresAt : startOfDay(new Date());
    const end = addDays(start, plan.durationDays);

    const result = await this.prisma.$transaction(async (tx) => {
      await tx.subscription.updateMany({ where: { memberId: payment.memberId, status: 'ACTIVE', endDate: { lt: new Date() } }, data: { status: 'EXPIRED' } });
      const sub = await tx.subscription.create({ data: { memberId: payment.memberId, planId: plan.id, startDate: start, endDate: end, price: payment.amount, status: 'ACTIVE', notes: `Pago en línea ${payment.provider}` } });
      await tx.member.update({ where: { id: payment.memberId }, data: { planId: plan.id, expiresAt: end, status: 'ACTIVE' } });
      return tx.payment.update({ where: { id: payment.id }, data: { status: 'PAID', paidAt: new Date(), subscriptionId: sub.id, reference: providerRef }, include });
    });
    this.notifications.sendPaymentReceived(result.id).catch(() => null);
    this.notifications.notifyRole(['ADMIN', 'ACCOUNTANT'], { type: 'PAYMENT', title: `Pago en línea de ${payment.member.firstName} ${payment.member.lastName}`, body: `${result.concept} · ${result.amount}`, link: '/pagos' }).catch(() => null);
    return { confirmed: true, payment: result };
  }

  async handleWebhook(rawBody: Buffer, signature?: string) {
    const parsed = await this.stripe.parseWebhook(rawBody, signature);
    if (!parsed) return { received: true, handled: false };
    if (parsed.status === 'PAID') await this.confirmCheckout(parsed.providerRef, 'WEBHOOK');
    else await this.prisma.payment.updateMany({ where: { providerRef: parsed.providerRef, status: 'PENDING' }, data: { status: 'FAILED' } });
    return { received: true, handled: true };
  }

  // ── Factura PDF ──
  async invoicePdf(id: string) {
    const p = await this.prisma.payment.findUniqueOrThrow({ where: { id }, include: { member: true } });
    const settings = Object.fromEntries((await this.prisma.setting.findMany({ where: { key: { in: ['gymName', 'address', 'phone', 'email', 'currency', 'currencySymbol'] } } })).map((s) => [s.key, s.value]));
    const methods: Record<string, string> = { CASH: 'Efectivo', CARD: 'Tarjeta', TRANSFER: 'Transferencia', STRIPE: 'Stripe', ONLINE: 'Pago en línea' };
    const statuses: Record<string, string> = { PAID: 'Pagada', PENDING: 'Pendiente', FAILED: 'Fallida', REFUNDED: 'Reembolsada' };
    const buffer = await buildInvoicePdf({
      gym: { name: settings.gymName ?? 'GYM PRO', address: settings.address, phone: settings.phone, email: settings.email },
      invoiceNumber: p.invoiceNumber, date: p.paidAt, status: statuses[p.status] ?? p.status, method: methods[p.method] ?? p.method,
      member: { name: `${p.member.firstName} ${p.member.lastName}`, code: p.member.code, email: p.member.email },
      concept: p.concept, amount: p.amount, currency: settings.currency ?? 'USD', symbol: settings.currencySymbol ?? '$', notes: p.notes,
    });
    return { buffer, filename: `${p.invoiceNumber}.pdf` };
  }

  async stats() {
    const now = new Date();
    const monthStart = startOfMonth(now);
    const prevStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const [month, prev, pending, todayAgg, byMethod] = await Promise.all([
      this.prisma.payment.aggregate({ _sum: { amount: true }, _count: true, where: { status: 'PAID', paidAt: { gte: monthStart } } }),
      this.prisma.payment.aggregate({ _sum: { amount: true }, where: { status: 'PAID', paidAt: { gte: prevStart, lt: monthStart } } }),
      this.prisma.payment.aggregate({ _sum: { amount: true }, _count: true, where: { status: 'PENDING' } }),
      this.prisma.payment.aggregate({ _sum: { amount: true }, where: { status: 'PAID', paidAt: { gte: startOfDay(now) } } }),
      this.prisma.payment.groupBy({ by: ['method'], _sum: { amount: true }, where: { status: 'PAID', paidAt: { gte: monthStart } } }),
    ]);
    const monthTotal = month._sum.amount ?? 0;
    const prevTotal = prev._sum.amount ?? 0;
    return {
      monthTotal, monthCount: month._count, prevMonthTotal: prevTotal,
      growth: prevTotal ? Math.round(((monthTotal - prevTotal) / prevTotal) * 1000) / 10 : null,
      pendingTotal: pending._sum.amount ?? 0, pendingCount: pending._count, todayTotal: todayAgg._sum.amount ?? 0,
      byMethod: byMethod.map((m) => ({ method: m.method, total: m._sum.amount ?? 0 })),
      onlineProvider: this.provider().name,
    };
  }
}
