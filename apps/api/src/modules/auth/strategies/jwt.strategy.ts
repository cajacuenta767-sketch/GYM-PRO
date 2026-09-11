import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../../database/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService, private prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('jwt.secret'),
    });
  }

  async validate(payload: { sub: string }) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: { accessRole: true, member: { select: { id: true } }, staff: { select: { id: true } } },
    });
    if (!user || !user.isActive) throw new UnauthorizedException('Sesión inválida');
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      avatarUrl: user.avatarUrl,
      memberId: user.member?.id ?? null,
      staffId: user.staff?.id ?? null,
      permissions: safeJson(user.accessRole?.permissions),
    };
  }
}

function safeJson(value?: string | null): string[] {
  try {
    return value ? JSON.parse(value) : [];
  } catch {
    return [];
  }
}
