import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { paginate } from '../../common/utils';
import { CreateNewsletterDto, QueryNewslettersDto, UpdateNewsletterDto } from './dto/newsletter.dto';

@Injectable()
export class NewslettersService {
  constructor(private prisma: PrismaService) {}

  findAll(query: QueryNewslettersDto) {
    return paginate(this.prisma.newsletter, query, {
      where: query.status ? { status: query.status } : undefined,
      searchFields: ['title', 'subject'],
      sortable: ['title', 'status', 'sentAt', 'createdAt'],
      defaultSort: { createdAt: 'desc' },
    });
  }

  findOne(id: string) { return this.prisma.newsletter.findUniqueOrThrow({ where: { id } }); }

  create(dto: CreateNewsletterDto) {
    return this.prisma.newsletter.create({
      data: { ...dto, scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : undefined, status: dto.scheduledAt ? 'SCHEDULED' : dto.status ?? 'DRAFT' },
    });
  }

  update(id: string, dto: UpdateNewsletterDto) {
    return this.prisma.newsletter.update({ where: { id }, data: { ...dto, scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : undefined } });
  }

  /** Simula el envío: calcula destinatarios según la audiencia y marca como enviado. */
  async send(id: string) {
    const nl = await this.prisma.newsletter.findUniqueOrThrow({ where: { id } });
    const recipients = await this.countAudience(nl.audience);
    return this.prisma.newsletter.update({
      where: { id },
      data: { status: 'SENT', sentAt: new Date(), recipientsCount: recipients, openRate: Math.round((35 + Math.random() * 40) * 10) / 10 },
    });
  }

  remove(id: string) { return this.prisma.newsletter.delete({ where: { id }, select: { id: true } }); }

  async countAudience(audience: string) {
    switch (audience) {
      case 'MEMBERS': return this.prisma.member.count();
      case 'ACTIVE_MEMBERS': return this.prisma.member.count({ where: { status: 'ACTIVE' } });
      case 'EXPIRED_MEMBERS': return this.prisma.member.count({ where: { status: 'EXPIRED' } });
      case 'STAFF': return this.prisma.staff.count({ where: { isActive: true } });
      default: return (await this.prisma.member.count()) + (await this.prisma.staff.count());
    }
  }
}
