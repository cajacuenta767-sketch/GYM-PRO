/** Catálogo de permisos del sistema, agrupados por módulo. */
export const PERMISSION_MODULES = [
  { key: 'dashboard', label: 'Tablero' },
  { key: 'memberships', label: 'Membresías' },
  { key: 'groups', label: 'Grupos' },
  { key: 'classes', label: 'Clases y horarios' },
  { key: 'bookings', label: 'Reservas' },
  { key: 'nutrition', label: 'Nutrición' },
  { key: 'members', label: 'Miembros' },
  { key: 'staff', label: 'Equipo' },
  { key: 'activities', label: 'Actividades' },
  { key: 'exercises', label: 'Ejercicios' },
  { key: 'store', label: 'Tienda' },
  { key: 'events', label: 'Eventos' },
  { key: 'attendance', label: 'Asistencia' },
  { key: 'payments', label: 'Pagos' },
  { key: 'messages', label: 'Mensajes' },
  { key: 'newsletters', label: 'Boletines' },
  { key: 'notices', label: 'Avisos' },
  { key: 'reports', label: 'Reportes' },
  { key: 'subscriptions', label: 'Suscripciones' },
  { key: 'settings', label: 'Configuración' },
  { key: 'access', label: 'Control de acceso' },
] as const;

export const PERMISSION_ACTIONS = ['read', 'write', 'delete'] as const;

export const ALL_PERMISSIONS = PERMISSION_MODULES.flatMap((m) => PERMISSION_ACTIONS.map((a) => `${m.key}.${a}`));
