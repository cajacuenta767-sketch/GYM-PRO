import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators';
import { PrismaService } from '../../database/prisma.service';
import { ClassesService } from '../classes/classes.service';

const PUBLIC_KEYS = ['gymName', 'slogan', 'email', 'phone', 'address', 'city', 'website', 'openingHours', 'logoUrl', 'currency', 'currencySymbol', 'whatsappNumber', 'primaryColor'];

@ApiTags('Público')
@Controller('public')
export class PublicController {
  constructor(private prisma: PrismaService, private classes: ClassesService) {}

  @Public()
  @Get('info')
  @ApiOperation({ summary: 'Información pública del gimnasio: planes, horario, eventos y sedes' })
  async info() {
    const [settings, plans, weekly, events, branches, counts] = await Promise.all([
      this.prisma.setting.findMany({ where: { key: { in: PUBLIC_KEYS } } }),
      this.prisma.membershipPlan.findMany({ where: { isActive: true }, orderBy: { price: 'asc' }, select: { id: true, name: true, description: true, durationDays: true, price: true, registrationFee: true, color: true, benefits: true } }),
      this.classes.weekly(),
      this.prisma.event.findMany({ where: { isPublic: true, startsAt: { gte: new Date() } }, orderBy: { startsAt: 'asc' }, take: 6, select: { id: true, title: true, description: true, type: true, startsAt: true, location: true, fee: true, color: true } }),
      this.prisma.branch.findMany({ where: { isActive: true }, select: { id: true, name: true, address: true, phone: true } }),
      Promise.all([this.prisma.member.count({ where: { status: 'ACTIVE' } }), this.prisma.gymClass.count({ where: { isActive: true } }), this.prisma.staff.count({ where: { role: 'TRAINER', isActive: true } })]),
    ]);
    return {
      gym: Object.fromEntries(settings.map((s) => [s.key, s.value])),
      plans: plans.map((p) => ({ ...p, benefits: safe(p.benefits) })),
      schedule: weekly,
      events,
      branches,
      stats: { members: counts[0], classes: counts[1], trainers: counts[2] },
    };
  }
}

function safe(v: string) { try { return JSON.parse(v); } catch { return []; } }
