import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { ACTION_KEY, MODULE_KEY, SKIP_PERMISSIONS_KEY } from '../decorators/module-key.decorator';
import { PORTAL_KEY } from '../decorators/portal.decorator';

const METHOD_ACTION: Record<string, 'read' | 'write' | 'delete'> = { GET: 'read', HEAD: 'read', OPTIONS: 'read', POST: 'write', PATCH: 'write', PUT: 'write', DELETE: 'delete' };

/** Permisos por defecto cuando la cuenta no tiene un rol de permisos asignado. */
const LEGACY: Record<string, (module: string, action: string) => boolean> = {
  STAFF: (m, a) => !['settings', 'access', 'users'].includes(m) || a === 'read',
  ACCOUNTANT: (m, a) => ['payments', 'subscriptions', 'store', 'reports'].includes(m) || a === 'read',
  MEMBER: () => false,
};

/**
 * Permisos finos por módulo y acción. Se evalúa después de RolesGuard.
 * Un controlador sin @ModuleKey no aplica esta comprobación.
 */
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const targets = [context.getHandler(), context.getClass()];
    if (this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, targets)) return true;
    if (this.reflector.getAllAndOverride<boolean>(SKIP_PERMISSIONS_KEY, targets)) return true;
    const moduleKey = this.reflector.getAllAndOverride<string>(MODULE_KEY, targets);
    if (!moduleKey) return true;

    const req = context.switchToHttp().getRequest();
    const user = req.user;
    if (!user) return false;
    if (user.role === 'ADMIN') return true;
    // Las rutas del portal ya fueron autorizadas por RolesGuard para cuentas MEMBER
    if (user.role === 'MEMBER' && this.reflector.getAllAndOverride<boolean>(PORTAL_KEY, targets)) return true;

    const action = this.reflector.getAllAndOverride<'read' | 'write' | 'delete'>(ACTION_KEY, targets) ?? METHOD_ACTION[req.method] ?? 'write';
    const perms: string[] = user.permissions ?? [];
    const allowed = perms.length ? perms.includes(`${moduleKey}.${action}`) : (LEGACY[user.role]?.(moduleKey, action) ?? false);
    if (!allowed) throw new ForbiddenException(`No tienes permiso para ${labelFor(action)} en ${moduleKey}`);
    return true;
  }
}

const labelFor = (a: string) => ({ read: 'consultar', write: 'crear o editar', delete: 'eliminar' }[a] ?? a);
