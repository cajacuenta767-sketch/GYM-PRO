import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { paginate } from '../../common/utils';
import { CreateEventDto, QueryEventsDto, RsvpDto, UpdateEventDto } from './dto/event.dto';

const include = { _count: { select: { rsvps: true } } };

@Injectable()
export class EventsService {
  constructor(private prisma: PrismaService) {}

  findAll(query: QueryEventsDto) {
    const where: any = {};
    if (query.type) where.type = query.type;
    if (query.from || query.to) {
      where.startsAt = {};
      if (query.from) where.startsAt.gte = new Date(query.from);
      if (query.to) where.startsAt.lte = new Date(query.to);
    }
    return paginate(this.prisma.event, query, {
      where,
      include,
      searchFields: ['title', 'location', 'description'],
      sortable: ['title', 'startsAt', 'type', 'createdAt'],
      defaultSort: { startsAt: 'desc' },
    });
  }

  upcoming(limit = 5) {
    return this.prisma.event.findMany({ where: { startsAt: { gte: new Date() } }, include, orderBy: { startsAt: 'asc' }, take: limit });
  }

  findOne(id: string) {
    return this.prisma.event.findUniqueOrThrow({
      where: { id },
      include: { ...include, rsvps: { include: { member: { select: { id: true, code: true, firstName: true, lastName: true, photoUrl: true } } } } },
    });
  }

  create(dto: CreateEventDto) {
    return this.prisma.event.create({
      data: { ...dto, startsAt: new Date(dto.startsAt), endsAt: dto.endsAt ? new Date(dto.endsAt) : undefined },
      include,
    });
  }

  update(id: string, dto: UpdateEventDto) {
    return this.prisma.event.update({
      where: { id },
      data: { ...dto, startsAt: dto.startsAt ? new Date(dto.startsAt) : undefined, endsAt: dto.endsAt ? new Date(dto.endsAt) : undefined },
      include,
    });
  }

  remove(id: string) { return this.prisma.event.delete({ where: { id }, select: { id: true } }); }

  rsvp(eventId: string, dto: RsvpDto) {
    return this.prisma.eventRsvp.upsert({
      where: { eventId_memberId: { eventId, memberId: dto.memberId } },
      create: { eventId, memberId: dto.memberId, status: dto.status ?? 'GOING' },
      update: { status: dto.status ?? 'GOING' },
    });
  }
}
