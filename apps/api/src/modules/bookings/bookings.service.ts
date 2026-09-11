import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { paginate, startOfDay, endOfDay } from '../../common/utils';
import { CreateBookingDto, QueryBookingsDto, UpdateBookingDto } from './dto/booking.dto';

const include = {
  member: { select: { id: true, code: true, firstName: true, lastName: true, photoUrl: true } },
  class: { select: { id: true, name: true, color: true, location: true, capacity: true, bookingFee: true } },
  schedule: true,
};

@Injectable()
export class BookingsService {
  constructor(private prisma: PrismaService) {}

  findAll(query: QueryBookingsDto) {
    const where: any = {};
    if (query.status) where.status = query.status;
    if (query.classId) where.classId = query.classId;
    if (query.memberId) where.memberId = query.memberId;
    if (query.from || query.to) {
      where.date = {};
      if (query.from) where.date.gte = startOfDay(new Date(query.from));
      if (query.to) where.date.lte = endOfDay(new Date(query.to));
    }
    return paginate(this.prisma.booking, query, {
      where,
      include,
      searchFields: ['member.firstName', 'member.lastName', 'member.code', 'class.name'],
      sortable: ['date', 'status', 'createdAt'],
      defaultSort: { date: 'desc' },
    });
  }

  findOne(id: string) {
    return this.prisma.booking.findUniqueOrThrow({ where: { id }, include });
  }

  async create(dto: CreateBookingDto) {
    const gymClass = await this.prisma.gymClass.findUniqueOrThrow({ where: { id: dto.classId } });
    const date = new Date(dto.date);
    const taken = await this.prisma.booking.count({
      where: { classId: dto.classId, status: { in: ['CONFIRMED', 'ATTENDED'] }, date: { gte: startOfDay(date), lte: endOfDay(date) } },
    });
    if (taken >= gymClass.capacity) throw new BadRequestException('La clase ya alcanzó su capacidad máxima para esa fecha');

    return this.prisma.booking.create({
      data: { ...dto, date, amount: dto.amount ?? gymClass.bookingFee },
      include,
    });
  }

  update(id: string, dto: UpdateBookingDto) {
    return this.prisma.booking.update({
      where: { id },
      data: { ...dto, date: dto.date ? new Date(dto.date) : undefined },
      include,
    });
  }

  remove(id: string) {
    return this.prisma.booking.delete({ where: { id }, select: { id: true } });
  }

  async stats() {
    const today = new Date();
    const [todayCount, confirmed, attended, noShow] = await Promise.all([
      this.prisma.booking.count({ where: { date: { gte: startOfDay(today), lte: endOfDay(today) }, status: { not: 'CANCELLED' } } }),
      this.prisma.booking.count({ where: { status: 'CONFIRMED' } }),
      this.prisma.booking.count({ where: { status: 'ATTENDED' } }),
      this.prisma.booking.count({ where: { status: 'NO_SHOW' } }),
    ]);
    return { today: todayCount, confirmed, attended, noShow };
  }
}
