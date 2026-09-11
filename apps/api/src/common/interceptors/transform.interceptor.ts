import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable, map } from 'rxjs';

/**
 * Envuelve todas las respuestas en { success, data, meta? }.
 * Los servicios que ya devuelven { data, meta } (paginados) se respetan.
 */
@Injectable()
export class TransformInterceptor implements NestInterceptor {
  intercept(_: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((result) => {
        if (result && typeof result === 'object' && 'data' in result && 'meta' in result) {
          return { success: true, ...result };
        }
        return { success: true, data: result };
      }),
    );
  }
}
