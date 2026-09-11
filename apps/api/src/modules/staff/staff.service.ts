import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { paginate } from '../../common/utils';
import { CreateStaffDto, QueryStaffDto, UpdateStaffDto } from './dto/staff.dto';

const include = { _count: { select: { members: true, classes: true, activities: true } } };

@Injectable()
export class StaffService {
  constructor(private prisma: PrismaService) {}

  findAll(query: QueryStaffDto) {
    const where: any = {};
    if (query.role) where.role = query.role;
    if (query.isActive !== undefined && query.isActive !== '') where.isActive = query.isActive === 'true';
    return paginate(this.prisma.staff, query, {
      where,
      include,
      searchFields: ['firstName', 'lastName', 'code', 'email', 'specialty'],
      sortable: ['firstName', 'lastName', 'role', 'hireDate', 'createdAt'],
      defaultSort: { firstName: 'asc' },
    });
  }

  findOne(id: string) {
    return this.prisma.staff.findUniqueOrThrow({
      where: { id },
      include: {
        ...include,
        classes: { select: { id: true, name: true, color: true, schedules: true } },
        members: { select: { id: true, code: true, firstName: true, lastName: true, photoUrl: true, status: true }, take: 20 },
      },
    });
  }

  async create(dto: CreateStaffDto) {
    const code = dto.code ?? (await this.nextCode());
    return this.prisma.staff.create({
      data: { ...dto, code, hireDate: dto.hireDate ? new Date(dto.hireDate) : undefined },
      include,
    });
  }

  update(id: string, dto: UpdateStaffDto) {
    return this.prisma.staff.update({
      where: { id },
      data: { ...dto, hireDate: dto.hireDate ? new Date(dto.hireDate) : undefined },
      include,
    });
  }

  remove(id: string) {
    return this.prisma.staff.delete({ where: { id }, select: { id: true } });
  }

  private async nextCode() {
    const count = await this.prisma.staff.count();
    return `E${String(count + 1).padStart(4, '0')}`;
  }
}
