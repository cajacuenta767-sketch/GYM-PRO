import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { endOfDay, paginate, sequential, startOfDay, startOfMonth } from '../../common/utils';
import { CreatePaymentDto, QueryPaymentsDto, UpdatePaymentDto } from './dto/payment.dto';

const include = {
  member: { select: { id: true, code: true, firstName: true, lastName: true, photoUrl: true } },
  subscription: { select: { id: true, startDate: true, endDate: true, plan: { select: { name: true } } } },
};

@Injectable()
export class PaymentsService {
  constructor(private prisma: PrismaService) {}

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
      where,
      include,
      searchFields: ['invoiceNumber', 'concept', 'reference', 'member.firstName', 'member.lastName', 'member.code'],
      sortable: ['invoiceNumber', 'amount', 'paidAt', 'status', 'method'],
      defaultSort: { paidAt: 'desc' },
    });
  }

  findOne(id: string) { return this.prisma.payment.findUniqueOrThrow({ where: { id }, include }); }

  async create(dto: CreatePaymentDto) {
    const count = await this.prisma.payment.count();
    return this.prisma.payment.create({
      data: {
        ...dto,
        invoiceNumber: sequential('FAC', count + 1),
        paidAt: dto.paidAt ? new Date(dto.paidAt) : new Date(),
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
      },
      include,
    });
  }

  update(id: string, dto: UpdatePaymentDto) {
    return this.prisma.payment.update({
      where: { id },
      data: { ...dto, paidAt: dto.paidAt ? new Date(dto.paidAt) : undefined, dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined },
      include,
    });
  }

  remove(id: string) { return this.prisma.payment.delete({ where: { id }, select: { id: true } }); }

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
      monthTotal,
      monthCount: month._count,
      prevMonthTotal: prevTotal,
      growth: prevTotal ? Math.round(((monthTotal - prevTotal) / prevTotal) * 1000) / 10 : null,
      pendingTotal: pending._sum.amount ?? 0,
      pendingCount: pending._count,
      todayTotal: todayAgg._sum.amount ?? 0,
      byMethod: byMethod.map((m) => ({ method: m.method, total: m._sum.amount ?? 0 })),
    };
  }
}
