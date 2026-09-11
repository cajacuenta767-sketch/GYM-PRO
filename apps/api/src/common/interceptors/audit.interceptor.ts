import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, tap } from 'rxjs';
import { PrismaService } from '../../database/prisma.service';
import { MODULE_KEY } from '../decorators/module-key.decorator';

const ACTIONS: Record<string, string> = { POST: 'CREATE', PATCH: 'UPDATE', PUT: 'UPDATE', DELETE: 'DELETE' };
const SKIP = [/^\/api\/v1\/auth\//, /\/read$/, /\/read-all$/, /\/notifications/, /\/check-in$/];

/** Registra automáticamente en AuditLog cualquier operación de escritura realizada por un usuario. */
@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger('Audit');
  constructor(private prisma: PrismaService, private reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const action = ACTIONS[req.method];
    if (!action || !req.user || SKIP.some((r) => r.test(req.originalUrl ?? req.url))) return next.handle();

    const moduleKey = this.reflector.getAllAndOverride<string>(MODULE_KEY, [context.getHandler(), context.getClass()]) ?? context.getClass().name.replace('Controller', '').toLowerCase();

    return next.handle().pipe(
      tap((result) => {
        const entityId = req.params?.id ?? result?.id ?? null;
        const name = result?.name ?? (result?.firstName ? `${result.firstName} ${result.lastName ?? ''}`.trim() : result?.title ?? result?.invoiceNumber ?? result?.number ?? null);
        this.prisma.auditLog
          .create({ data: { userId: req.user.id, action, entity: moduleKey, entityId, detail: `${req.method} ${req.originalUrl ?? req.url}${name ? ` · ${name}` : ''}` } })
          .catch((e) => this.logger.warn(`No se pudo registrar auditoría: ${e.message}`));
      }),
    );
  }
}
