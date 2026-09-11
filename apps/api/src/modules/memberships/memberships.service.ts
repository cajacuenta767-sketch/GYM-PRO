import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { PaginationDto } from '../../common/dto';
import { paginate } from '../../common/utils';
import { CreateMembershipDto, UpdateMembershipDto } from './dto/membership.dto';

const include = {
  activities: { include: { activity: { select: { id: true, name: true, category: true } } } },
  _count: { select: { members: true, subscriptions: true } },
};

@Injectable()
export class MembershipsService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: PaginationDto) {
    const result = await paginate(this.prisma.membershipPlan, query, {
      include,
      searchFields: ['name', 'description'],
      sortable: ['name', 'price', 'durationDays', 'createdAt'],
      defaultSort: { price: 'asc' },
    });
    return { ...result, data: result.data.map(this.serialize) };
  }

  async findOne(id: string) {
    const plan = await this.prisma.membershipPlan.findUniqueOrThrow({ where: { id }, include });
    return this.serialize(plan);
  }

  async create(dto: CreateMembershipDto) {
    const { activityIds, benefits, ...data } = dto;
    const plan = await this.prisma.membershipPlan.create({
      data: {
        ...data,
        benefits: JSON.stringify(benefits ?? []),
        activities: activityIds?.length
          ? { create: activityIds.map((activityId) => ({ activityId })) }
          : undefined,
      },
      include,
    });
    return this.serialize(plan);
  }

  async update(id: string, dto: UpdateMembershipDto) {
    const { activityIds, benefits, ...data } = dto;
    const plan = await this.prisma.membershipPlan.update({
      where: { id },
      data: {
        ...data,
        ...(benefits ? { benefits: JSON.stringify(benefits) } : {}),
        ...(activityIds
          ? { activities: { deleteMany: {}, create: activityIds.map((activityId) => ({ activityId })) } }
          : {}),
      },
      include,
    });
    return this.serialize(plan);
  }

  remove(id: string) {
    return this.prisma.membershipPlan.delete({ where: { id }, select: { id: true } });
  }

  private serialize = (plan: any) => ({
    ...plan,
    benefits: safeParse(plan.benefits),
    activities: plan.activities?.map((a: any) => a.activity) ?? [],
    membersCount: plan._count?.members ?? 0,
    subscriptionsCount: plan._count?.subscriptions ?? 0,
    _count: undefined,
  });
}

function safeParse(v: string) {
  try {
    return JSON.parse(v);
  } catch {
    return [];
  }
}
