import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

export const SETTING_GROUPS: Record<string, string> = {
  gymName: 'general', slogan: 'general', email: 'general', phone: 'general', address: 'general', city: 'general',
  website: 'general', timezone: 'general', language: 'general', openingHours: 'general', logoUrl: 'general',
  currency: 'billing', currencySymbol: 'billing', taxRate: 'billing', invoicePrefix: 'billing', stripeEnabled: 'billing',
  stripePublicKey: 'billing', lateFee: 'billing',
  notifyExpiring: 'notifications', expiringDays: 'notifications', notifyBirthday: 'notifications', notifyNewMember: 'notifications',
  smtpHost: 'notifications', smtpPort: 'notifications', smtpUser: 'notifications', smtpPass: 'notifications', smtpFrom: 'notifications', whatsappNumber: 'notifications',
  setupCompleted: 'general',
  primaryColor: 'appearance', theme: 'appearance', compactSidebar: 'appearance',
  qrCheckIn: 'access', autoCheckOutMinutes: 'access', allowExpiredGrace: 'access', graceDays: 'access', maxCapacity: 'access',
};

@Injectable()
export class SettingsService {
  constructor(private prisma: PrismaService) {}

  async getAll() {
    const rows = await this.prisma.setting.findMany();
    const values: Record<string, any> = {};
    for (const r of rows) values[r.key] = parse(r.value);
    return values;
  }

  /** Exporta todas las tablas a JSON (sin contraseñas ni tokens). */
  async backup() {
    const out: Record<string, unknown[]> = {};
    for (const t of BACKUP_TABLES) {
      const rows = await (this.prisma as any)[t].findMany();
      out[t] = t === 'user' ? rows.map(({ password: _p, ...u }: any) => u) : rows;
    }
    return { generatedAt: new Date().toISOString(), version: 1, tables: out };
  }

  async update(values: Record<string, any>) {
    const entries = Object.entries(values);
    await this.prisma.$transaction(
      entries.map(([key, value]) =>
        this.prisma.setting.upsert({
          where: { key },
          create: { key, value: String(value ?? ''), group: SETTING_GROUPS[key] ?? 'general' },
          update: { value: String(value ?? '') },
        }),
      ),
    );
    return this.getAll();
  }
}

export const BACKUP_TABLES = ['branch', 'role', 'user', 'membershipPlan', 'membershipPlanActivity', 'activity', 'staff', 'member', 'group', 'groupMember', 'gymClass', 'classSchedule', 'memberClass', 'booking', 'subscription', 'membershipFreeze', 'payment', 'measurement', 'nutritionSchedule', 'exerciseCategory', 'exercise', 'routine', 'routineDay', 'routineExercise', 'productCategory', 'product', 'sale', 'saleItem', 'event', 'eventRsvp', 'attendance', 'accessLog', 'message', 'newsletter', 'notice', 'notification', 'setting'] as const;

function parse(v: string) {
  if (v === 'true') return true;
  if (v === 'false') return false;
  if (v !== '' && !isNaN(Number(v)) && /^-?\d+(\.\d+)?$/.test(v)) return Number(v);
  return v;
}
