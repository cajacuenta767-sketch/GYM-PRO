import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../database/prisma.service';
import { PaginationDto } from '../../common/dto';
import { paginate } from '../../common/utils';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';

const publicSelect = {
  id: true, email: true, name: true, role: true, roleId: true, avatarUrl: true,
  isActive: true, lastLoginAt: true, createdAt: true, updatedAt: true,
  accessRole: { select: { id: true, name: true } },
};

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  findAll(query: PaginationDto & { role?: string }) {
    return paginate(this.prisma.user, query, {
      where: query.role ? { role: query.role } : undefined,
      select: publicSelect,
      searchFields: ['name', 'email'],
      sortable: ['name', 'email', 'role', 'createdAt', 'lastLoginAt'],
    });
  }

  findOne(id: string) {
    return this.prisma.user.findUniqueOrThrow({ where: { id }, select: publicSelect });
  }

  async create(dto: CreateUserDto) {
    const password = await bcrypt.hash(dto.password, 10);
    return this.prisma.user.create({
      data: { ...dto, email: dto.email.toLowerCase(), password },
      select: publicSelect,
    });
  }

  async update(id: string, dto: UpdateUserDto) {
    const data: any = { ...dto };
    if (dto.email) data.email = dto.email.toLowerCase();
    if (dto.password) data.password = await bcrypt.hash(dto.password, 10);
    return this.prisma.user.update({ where: { id }, data, select: publicSelect });
  }

  remove(id: string) {
    return this.prisma.user.delete({ where: { id }, select: { id: true } });
  }
}
