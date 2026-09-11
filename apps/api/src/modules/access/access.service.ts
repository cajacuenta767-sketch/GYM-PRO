import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { PaginationDto } from '../../common/dto';
import { endOfDay, paginate, startOfDay } from '../../common/utils';
import { CreateRoleDto, QueryAccessLogsDto, UpdateRoleDto } from './dto/access.dto';
import { ALL_PERMISSIONS, PERMISSION_ACTIONS, PERMISSION_MODULES } from './permissions';

@Injectable()
export class AccessService {
  constructor(private prisma: PrismaService) {}

  permissionsCatalog() {
    return { modules: PERMISSION_MODULES, actions: PERMISSION_ACTIONS, all: ALL_PERMISSIONS };
  }

  async roles() {
    const rows = await this.prisma.role.findMany({ include: { _count: { select: { users: true } } }, orderBy: { name: 'asc' } });
    return rows.map((r) => ({ ...r, permissions: parse(r.permissions), usersCount: r._count.users, _count: undefined }));
  }

  async role(id: string) {
    const r = await this.prisma.role.findUniqueOrThrow({
      where: { id },
      include: { users: { select: { id: true, name: true, email: true, role: true, avatarUrl: true } } },
    });
    return { ...r, permissions: parse(r.permissions) };
  }

  async createRole(dto: CreateRoleDto) {
    this.validate(dto.permissions);
    const r = await this.prisma.role.create({ data: { ...dto, permissions: JSON.stringify(dto.permissions) } });
    return { ...r, permissions: dto.permissions };
  }

  async updateRole(id: string, dto: UpdateRoleDto) {
    if (dto.permissions) this.validate(dto.permissions);
    const r = await this.prisma.role.update({
      where: { id },
      data: { ...dto, permissions: dto.permissions ? JSON.stringify(dto.permissions) : undefined },
    });
    return { ...r, permissions: parse(r.permissions) };
  }

  async removeRole(id: string) {
    const r = await this.prisma.role.findUniqueOrThrow({ where: { id } });
    if (r.isSystem) throw new BadRequestException('Los roles del sistema no se pueden eliminar');
    return this.prisma.role.delete({ where: { id }, select: { id: true } });
  }

  accessLogs(query: QueryAccessLogsDto) {
    const where: any = {};
    if (query.memberId) where.memberId = query.memberId;
    if (query.allowed !== undefined && query.allowed !== '') where.allowed = query.allowed === 'true';
    if (query.from || query.to) {
      where.at = {};
      if (query.from) where.at.gte = startOfDay(new Date(query.from));
      if (query.to) where.at.lte = endOfDay(new Date(query.to));
    }
    return paginate(this.prisma.accessLog, query, {
      where,
      include: { member: { select: { id: true, code: true, firstName: true, lastName: true, photoUrl: true } } },
      searchFields: ['member.firstName', 'member.lastName', 'member.code', 'reason'],
      sortable: ['at', 'method', 'allowed'],
      defaultSort: { at: 'desc' },
    });
  }

  auditLogs(query: PaginationDto) {
    return paginate(this.prisma.auditLog, query, {
      include: { user: { select: { id: true, name: true, email: true } } },
      searchFields: ['action', 'entity', 'detail', 'user.name'],
      sortable: ['createdAt', 'action', 'entity'],
      defaultSort: { createdAt: 'desc' },
    });
  }

  private validate(perms: string[]) {
    const invalid = perms.filter((p) => !ALL_PERMISSIONS.includes(p));
    if (invalid.length) throw new BadRequestException(`Permisos no válidos: ${invalid.join(', ')}`);
  }
}

function parse(v: string): string[] {
  try { return JSON.parse(v); } catch { return []; }
}
