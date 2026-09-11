import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { PORTAL_KEY } from '../decorators/portal.decorator';

/**
 * Reglas por tipo de cuenta:
 *  - ADMIN: todo.
 *  - MEMBER: solo rutas marcadas con @PortalAccess().
 *  - @Roles(...) restringe una ruta a ciertos tipos de cuenta.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const targets = [context.getHandler(), context.getClass()];
    if (this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, targets)) return true;

    const { user } = context.switchToHttp().getRequest();
    if (!user) return false;
    if (user.role === 'ADMIN') return true;

    const portal = this.reflector.getAllAndOverride<boolean>(PORTAL_KEY, targets);
    if (user.role === 'MEMBER') {
      if (portal) return true;
      throw new ForbiddenException('Tu cuenta solo tiene acceso al portal del miembro');
    }

    const required = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, targets);
    if (!required || required.length === 0) return true;
    if (required.includes(user.role)) return true;
    throw new ForbiddenException('No tienes permisos para realizar esta acción');
  }
}
