import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { addDays, paginate, sequential, startOfDay } from '../../common/utils';
import { CreateSubscriptionDto, QuerySubscriptionsDto, UpdateSubscriptionDto } from './dto/subscription.dto';

const include = {
  member: { select: { id: true, code: true, firstName: true, lastName: true, photoUrl: true } },
  plan: { select: { id: true, name: true, color: true, durationDays: true } },
  payments: { select: { id: true, invoiceNumber: true, amount: true, status: true, paidAt: true } },
};

@Injectable()
export class SubscriptionsService {
  constructor(private prisma: PrismaService) {}

  findAll(query: QuerySubscriptionsDto) {
    const where: any = {};
    if (query.memberId) where.memberId = query.memberId;
    if (query.planId) where.planId = query.planId;
    if (query.status) where.status = query.status;
    return paginate(this.prisma.subscription, query, {
      where,
      include,
      searchFields: ['member.firstName', 'member.lastName', 'member.code', 'plan.name'],
      sortable: ['startDate', 'endDate', 'price', 'status', 'createdAt'],
      defaultSort: { startDate: 'desc' },
    });
  }

  findOne(id: string) { return this.prisma.subscription.findUniqueOrThrow({ where: { id }, include }); }

  /** Alta de suscripción: calcula fin, actualiza el miembro y opcionalmente registra el pago. */
  async create(dto: CreateSubscriptionDto) {
    const plan = await this.prisma.membershipPlan.findUniqueOrThrow({ where: { id: dto.planId } });
    const startDate = dto.startDate ? new Date(dto.startDate) : startOfDay(new Date());
    const endDate = dto.endDate ? new Date(dto.endDate) : addDays(startDate, plan.durationDays);
    const price = dto.price ?? plan.price;

    return this.prisma.$transaction(async (tx) => {
      await tx.subscription.updateMany({ where: { memberId: dto.memberId, status: 'ACTIVE' }, data: { status: 'EXPIRED' } });
      const sub = await tx.subscription.create({
        data: { memberId: dto.memberId, planId: dto.planId, startDate, endDate, price, status: dto.status ?? 'ACTIVE', notes: dto.notes },
      });
      await tx.member.update({ where: { id: dto.memberId }, data: { planId: dto.planId, expiresAt: endDate, status: 'ACTIVE' } });
      if (dto.registerPayment) {
        const count = await tx.payment.count();
        await tx.payment.create({
          data: {
            invoiceNumber: sequential('FAC', count + 1),
            memberId: dto.memberId,
            subscriptionId: sub.id,
            concept: `Membresía ${plan.name}`,
            amount: price,
            method: dto.paymentMethod ?? 'CASH',
            status: 'PAID',
          },
        });
      }
      return tx.subscription.findUniqueOrThrow({ where: { id: sub.id }, include });
    });
  }

  update(id: string, dto: UpdateSubscriptionDto) {
    const { registerPayment: _r, paymentMethod: _p, ...data } = dto;
    return this.prisma.subscription.update({
      where: { id },
      data: { ...data, startDate: data.startDate ? new Date(data.startDate) : undefined, endDate: data.endDate ? new Date(data.endDate) : undefined },
      include,
    });
  }

  remove(id: string) { return this.prisma.subscription.delete({ where: { id }, select: { id: true } }); }

  async stats() {
    const now = new Date();
    const [active, expiringSoon, expired, byPlan] = await Promise.all([
      this.prisma.subscription.count({ where: { status: 'ACTIVE' } }),
      this.prisma.subscription.count({ where: { status: 'ACTIVE', endDate: { gte: now, lte: addDays(now, 15) } } }),
      this.prisma.subscription.count({ where: { status: 'EXPIRED' } }),
      this.prisma.subscription.groupBy({ by: ['planId'], _count: true, where: { status: 'ACTIVE' } }),
    ]);
    const plans = await this.prisma.membershipPlan.findMany({ select: { id: true, name: true, color: true } });
    return {
      active, expiringSoon, expired,
      byPlan: byPlan.map((b) => ({ plan: plans.find((p) => p.id === b.planId)?.name ?? '—', color: plans.find((p) => p.id === b.planId)?.color, count: b._count })),
    };
  }
}
