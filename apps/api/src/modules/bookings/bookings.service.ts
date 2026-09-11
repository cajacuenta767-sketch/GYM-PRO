import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { paginate, startOfDay, endOfDay } from '../../common/utils';
import { CreateBookingDto, QueryBookingsDto, UpdateBookingDto } from './dto/booking.dto';
import { NotificationsService } from '../notifications/notifications.service';

const include = {
  member: { select: { id: true, code: true, firstName: true, lastName: true, photoUrl: true } },
  class: { select: { id: true, name: true, color: true, location: true, capacity: true, bookingFee: true } },
  schedule: true,
};

@Injectable()
export class BookingsService {
  constructor(private prisma: PrismaService, private notifications: NotificationsService) {}

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
    const duplicate = await this.prisma.booking.findFirst({ where: { memberId: dto.memberId, classId: dto.classId, status: { in: ['CONFIRMED', 'WAITLISTED'] }, date: { gte: startOfDay(date), lte: endOfDay(date) } } });
    if (duplicate) throw new BadRequestException('El miembro ya tiene una reserva en esta clase para esa fecha');

    const full = taken >= gymClass.capacity;
    if (full && !dto.waitlist) throw new BadRequestException('La clase ya alcanzó su capacidad máxima para esa fecha');
    const { waitlist: _w, ...data } = dto;
    const booking = await this.prisma.booking.create({
      data: { ...data, date, amount: dto.amount ?? gymClass.bookingFee, status: full ? 'WAITLISTED' : dto.status ?? 'CONFIRMED' },
      include,
    });
    this.notifications.sendBookingConfirmed(booking.id).catch(() => null);
    return booking;
  }

  /** Cancela una reserva y, si era confirmada, promueve a la primera persona en lista de espera. */
  async cancel(id: string) {
    const booking = await this.prisma.booking.findUniqueOrThrow({ where: { id } });
    const updated = await this.prisma.booking.update({ where: { id }, data: { status: 'CANCELLED' }, include });
    if (booking.status === 'CONFIRMED') {
      const next = await this.prisma.booking.findFirst({
        where: { classId: booking.classId, status: 'WAITLISTED', date: { gte: startOfDay(booking.date), lte: endOfDay(booking.date) } },
        orderBy: { createdAt: 'asc' },
      });
      if (next) {
        await this.prisma.booking.update({ where: { id: next.id }, data: { status: 'CONFIRMED' } });
        this.notifications.sendWaitlistPromoted(next.id).catch(() => null);
      }
    }
    return updated;
  }

  /** Posición en lista de espera de una reserva. */
  async waitlistPosition(id: string) {
    const b = await this.prisma.booking.findUniqueOrThrow({ where: { id } });
    if (b.status !== 'WAITLISTED') return { position: null };
    const ahead = await this.prisma.booking.count({ where: { classId: b.classId, status: 'WAITLISTED', date: { gte: startOfDay(b.date), lte: endOfDay(b.date) }, createdAt: { lt: b.createdAt } } });
    return { position: ahead + 1 };
  }

  update(id: string, dto: UpdateBookingDto) {
    if (dto.status === 'CANCELLED') return this.cancel(id);
    const { waitlist: _w, ...data } = dto;
    return this.prisma.booking.update({
      where: { id },
      data: { ...data, date: dto.date ? new Date(dto.date) : undefined },
      include,
    });
  }

  remove(id: string) {
    return this.prisma.booking.delete({ where: { id }, select: { id: true } });
  }

  async stats() {
    const today = new Date();
    const [todayCount, confirmed, attended, noShow, waitlisted] = await Promise.all([
      this.prisma.booking.count({ where: { date: { gte: startOfDay(today), lte: endOfDay(today) }, status: { not: 'CANCELLED' } } }),
      this.prisma.booking.count({ where: { status: 'CONFIRMED' } }),
      this.prisma.booking.count({ where: { status: 'ATTENDED' } }),
      this.prisma.booking.count({ where: { status: 'NO_SHOW' } }),
      this.prisma.booking.count({ where: { status: 'WAITLISTED', date: { gte: startOfDay(today) } } }),
    ]);
    return { today: todayCount, confirmed, attended, noShow, waitlisted };
  }
}
