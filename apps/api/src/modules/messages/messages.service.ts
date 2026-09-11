import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { paginate } from '../../common/utils';
import { CreateMessageDto, QueryMessagesDto } from './dto/message.dto';

const userSel = { select: { id: true, name: true, email: true, avatarUrl: true, role: true } };
const include = { sender: userSel, recipient: userSel };

@Injectable()
export class MessagesService {
  constructor(private prisma: PrismaService) {}

  findAll(userId: string, query: QueryMessagesDto) {
    const where: any = query.box === 'sent' ? { senderId: userId } : { recipientId: userId };
    if (query.unread === 'true') where.readAt = null;
    return paginate(this.prisma.message, query, {
      where,
      include,
      searchFields: ['subject', 'body', 'sender.name', 'recipient.name'],
      sortable: ['createdAt', 'subject'],
      defaultSort: { createdAt: 'desc' },
    });
  }

  async findOne(userId: string, id: string) {
    const msg = await this.prisma.message.findUniqueOrThrow({ where: { id }, include });
    if (msg.recipientId === userId && !msg.readAt) {
      return this.prisma.message.update({ where: { id }, data: { readAt: new Date() }, include });
    }
    return msg;
  }

  send(senderId: string, dto: CreateMessageDto) {
    return this.prisma.message.create({ data: { ...dto, senderId }, include });
  }

  async markRead(userId: string, id: string) {
    return this.prisma.message.update({ where: { id, recipientId: userId }, data: { readAt: new Date() }, include });
  }

  async unreadCount(userId: string) {
    const count = await this.prisma.message.count({ where: { recipientId: userId, readAt: null } });
    return { count };
  }

  remove(userId: string, id: string) {
    return this.prisma.message.delete({ where: { id, OR: [{ senderId: userId }, { recipientId: userId }] }, select: { id: true } });
  }

  /** Destinatarios posibles (usuarios activos). */
  contacts() {
    return this.prisma.user.findMany({ where: { isActive: true }, select: { id: true, name: true, email: true, role: true, avatarUrl: true }, orderBy: { name: 'asc' } });
  }
}
