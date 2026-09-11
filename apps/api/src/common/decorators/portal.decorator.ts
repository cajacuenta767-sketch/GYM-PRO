import { SetMetadata } from '@nestjs/common';

/** Marca controladores/rutas accesibles para cuentas de tipo MEMBER (portal del socio). */
export const PORTAL_KEY = 'portalAccess';
export const PortalAccess = () => SetMetadata(PORTAL_KEY, true);
