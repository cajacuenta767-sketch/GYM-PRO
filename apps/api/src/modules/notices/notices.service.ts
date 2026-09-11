import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { paginate } from '../../common/utils';
import { CreateNoticeDto, QueryNoticesDto, UpdateNoticeDto } from './dto/notice.dto';

@Injectable()
export class NoticesService {
  constructor(private prisma: PrismaService) {}

  findAll(query: QueryNoticesDto) {
    const where: any = {};
    if (query.type) where.type = query.type;
    if (query.active === 'true') {
      const now = new Date();
      where.startsAt = { lte: now };
      where.OR = [{ endsAt: null }, { endsAt: { gte: now } }];
    }
    return paginate(this.prisma.notice, query, {
      where,
      searchFields: ['title', 'content'],
      sortable: ['title', 'type', 'startsAt', 'createdAt'],
      orderBy: [{ isPinned: 'desc' }, { startsAt: 'desc' }],
    });
  }

  active() {
    const now = new Date();
    return this.prisma.notice.findMany({
      where: { startsAt: { lte: now }, OR: [{ endsAt: null }, { endsAt: { gte: now } }] },
      orderBy: [{ isPinned: 'desc' }, { startsAt: 'desc' }],
      take: 6,
    });
  }

  findOne(id: string) { return this.prisma.notice.findUniqueOrThrow({ where: { id } }); }

  create(dto: CreateNoticeDto) {
    return this.prisma.notice.create({
      data: { ...dto, startsAt: dto.startsAt ? new Date(dto.startsAt) : undefined, endsAt: dto.endsAt ? new Date(dto.endsAt) : undefined },
    });
  }

  update(id: string, dto: UpdateNoticeDto) {
    return this.prisma.notice.update({
      where: { id },
      data: { ...dto, startsAt: dto.startsAt ? new Date(dto.startsAt) : undefined, endsAt: dto.endsAt !== undefined ? (dto.endsAt ? new Date(dto.endsAt) : null) : undefined },
    });
  }

  remove(id: string) { return this.prisma.notice.delete({ where: { id }, select: { id: true } }); }
}
