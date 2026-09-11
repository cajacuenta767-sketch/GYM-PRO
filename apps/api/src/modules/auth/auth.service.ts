import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { createHash, randomBytes } from 'node:crypto';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../database/prisma.service';
import { addDays } from '../../common/utils';
import { ChangePasswordDto, LoginDto } from './dto/login.dto';

const REFRESH_DAYS = 14;
const hash = (t: string) => createHash('sha256').update(t).digest('hex');

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService, private jwt: JwtService) {}

  async login(dto: LoginDto, userAgent?: string) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
      include: { accessRole: true, member: { select: { id: true, code: true, firstName: true, lastName: true, photoUrl: true } } },
    });
    if (!user || !user.isActive) throw new UnauthorizedException('Credenciales incorrectas');

    const valid = await bcrypt.compare(dto.password, user.password);
    if (!valid) throw new UnauthorizedException('Credenciales incorrectas');

    await this.prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
    await this.prisma.auditLog.create({ data: { userId: user.id, action: 'LOGIN', entity: 'auth', entityId: user.id } });

    const tokens = await this.issueTokens(user.id, user.role, userAgent);
    return { ...tokens, user: this.toPublic(user) };
  }

  /** Rotación de refresh token: el anterior queda revocado y se emite uno nuevo. */
  async refresh(token: string, userAgent?: string) {
    const stored = await this.prisma.refreshToken.findUnique({ where: { tokenHash: hash(token) }, include: { user: true } });
    if (!stored || stored.revokedAt || stored.expiresAt < new Date() || !stored.user.isActive) {
      throw new UnauthorizedException('La sesión ha expirado, inicia sesión de nuevo');
    }
    await this.prisma.refreshToken.update({ where: { id: stored.id }, data: { revokedAt: new Date() } });
    return this.issueTokens(stored.userId, stored.user.role, userAgent);
  }

  async logout(userId: string, token?: string) {
    if (token) await this.prisma.refreshToken.updateMany({ where: { tokenHash: hash(token), userId }, data: { revokedAt: new Date() } });
    else await this.prisma.refreshToken.updateMany({ where: { userId, revokedAt: null }, data: { revokedAt: new Date() } });
    return { loggedOut: true };
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      include: { accessRole: true, member: { select: { id: true, code: true, firstName: true, lastName: true, photoUrl: true } }, staff: { select: { id: true, code: true, role: true } } },
    });
    return this.toPublic(user);
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    const ok = await bcrypt.compare(dto.currentPassword, user.password);
    if (!ok) throw new UnauthorizedException('La contraseña actual no es correcta');
    await this.prisma.user.update({ where: { id: userId }, data: { password: await bcrypt.hash(dto.newPassword, 10) } });
    // Cierra el resto de sesiones
    await this.prisma.refreshToken.updateMany({ where: { userId, revokedAt: null }, data: { revokedAt: new Date() } });
    return { changed: true };
  }

  private async issueTokens(userId: string, role: string, userAgent?: string) {
    const accessToken = await this.jwt.signAsync({ sub: userId, role });
    const refreshToken = randomBytes(48).toString('base64url');
    await this.prisma.refreshToken.create({ data: { userId, tokenHash: hash(refreshToken), expiresAt: addDays(new Date(), REFRESH_DAYS), userAgent: userAgent?.slice(0, 200) } });
    // Limpieza de tokens vencidos o revocados hace más de 30 días
    await this.prisma.refreshToken.deleteMany({ where: { userId, OR: [{ expiresAt: { lt: new Date() } }, { revokedAt: { lt: addDays(new Date(), -30) } }] } });
    return { accessToken, refreshToken };
  }

  private toPublic(user: any) {
    const { password: _pw, accessRole, ...rest } = user;
    let permissions: string[] = [];
    try { permissions = accessRole?.permissions ? JSON.parse(accessRole.permissions) : []; } catch { permissions = []; }
    return { ...rest, roleName: accessRole?.name ?? null, permissions };
  }
}
