import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateBranchDto, UpdateBranchDto } from './dto/branch.dto';

const include = { _count: { select: { members: true, staff: true, classes: true } } };

@Injectable()
export class BranchesService {
  constructor(private prisma: PrismaService) {}
  findAll() { return this.prisma.branch.findMany({ include, orderBy: { name: 'asc' } }); }
  findOne(id: string) { return this.prisma.branch.findUniqueOrThrow({ where: { id }, include }); }
  create(dto: CreateBranchDto) { return this.prisma.branch.create({ data: dto, include }); }
  update(id: string, dto: UpdateBranchDto) { return this.prisma.branch.update({ where: { id }, data: dto, include }); }
  remove(id: string) { return this.prisma.branch.delete({ where: { id }, select: { id: true } }); }
}
