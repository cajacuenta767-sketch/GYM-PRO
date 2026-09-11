import { SetMetadata } from '@nestjs/common';

/**
 * Asocia un controlador a un módulo del catálogo de permisos (ver modules/access/permissions.ts).
 * El PermissionsGuard deriva la acción del método HTTP: GET → read, POST/PATCH/PUT → write, DELETE → delete.
 */
export const MODULE_KEY = 'moduleKey';
export const ModuleKey = (key: string) => SetMetadata(MODULE_KEY, key);

/** Sobrescribe la acción requerida en una ruta concreta (p. ej. un POST que solo consulta). */
export const ACTION_KEY = 'permissionAction';
export const Action = (action: 'read' | 'write' | 'delete') => SetMetadata(ACTION_KEY, action);
