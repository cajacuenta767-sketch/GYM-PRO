import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { PaginationDto } from '../../common/dto';
import { paginate } from '../../common/utils';
import { CreateGroupDto, UpdateGroupDto } from './dto/group.dto';

const include = { _count: { select: { members: true } } };
const memberSelect = { id: true, code: true, firstName: true, lastName: true, photoUrl: true, status: true };

@Injectable()
export class GroupsService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: PaginationDto) {
    const result = await paginate(this.prisma.group, query, {
      include: { ...include, members: { take: 5, include: { member: { select: memberSelect } } } },
      searchFields: ['name', 'description'],
      sortable: ['name', 'createdAt'],
      defaultSort: { name: 'asc' },
    });
    return { ...result, data: result.data.map(this.serialize) };
  }

  async findOne(id: string) {
    const group = await this.prisma.group.findUniqueOrThrow({
      where: { id },
      include: { ...include, members: { include: { member: { select: memberSelect } } } },
    });
    return this.serialize(group);
  }

  async create(dto: CreateGroupDto) {
    const { memberIds, ...data } = dto;
    const group = await this.prisma.group.create({
      data: { ...data, members: memberIds?.length ? { create: memberIds.map((memberId) => ({ memberId })) } : undefined },
      include: { ...include, members: { include: { member: { select: memberSelect } } } },
    });
    return this.serialize(group);
  }

  async update(id: string, dto: UpdateGroupDto) {
    const { memberIds, ...data } = dto;
    const group = await this.prisma.group.update({
      where: { id },
      data: {
        ...data,
        ...(memberIds ? { members: { deleteMany: {}, create: memberIds.map((memberId) => ({ memberId })) } } : {}),
      },
      include: { ...include, members: { include: { member: { select: memberSelect } } } },
    });
    return this.serialize(group);
  }

  async addMembers(id: string, memberIds: string[]) {
    await this.prisma.groupMember.createMany({ data: memberIds.map((memberId) => ({ groupId: id, memberId })) });
    return this.findOne(id);
  }

  async removeMember(id: string, memberId: string) {
    await this.prisma.groupMember.delete({ where: { groupId_memberId: { groupId: id, memberId } } });
    return this.findOne(id);
  }

  remove(id: string) {
    return this.prisma.group.delete({ where: { id }, select: { id: true } });
  }

  private serialize = (g: any) => ({
    ...g,
    members: g.members?.map((m: any) => m.member) ?? [],
    membersCount: g._count?.members ?? 0,
    _count: undefined,
  });
}
