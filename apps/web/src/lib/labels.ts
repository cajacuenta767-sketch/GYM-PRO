/** Etiquetas en español y colores para los valores de estado del sistema. */
export type Tone = 'brand' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';

export const MEMBER_STATUS: Record<string, { label: string; tone: Tone }> = {
  ACTIVE: { label: 'Activo', tone: 'success' },
  INACTIVE: { label: 'Inactivo', tone: 'neutral' },
  SUSPENDED: { label: 'Suspendido', tone: 'warning' },
  EXPIRED: { label: 'Vencido', tone: 'danger' },
};
export const SUBSCRIPTION_STATUS: Record<string, { label: string; tone: Tone }> = {
  ACTIVE: { label: 'Activa', tone: 'success' }, EXPIRED: { label: 'Vencida', tone: 'danger' },
  CANCELLED: { label: 'Cancelada', tone: 'neutral' }, PENDING: { label: 'Pendiente', tone: 'warning' },
};
export const PAYMENT_STATUS: Record<string, { label: string; tone: Tone }> = {
  PAID: { label: 'Pagado', tone: 'success' }, PENDING: { label: 'Pendiente', tone: 'warning' },
  FAILED: { label: 'Fallido', tone: 'danger' }, REFUNDED: { label: 'Reembolsado', tone: 'info' },
};
export const PAYMENT_METHOD: Record<string, string> = { CASH: 'Efectivo', CARD: 'Tarjeta', TRANSFER: 'Transferencia', STRIPE: 'Stripe' };
export const BOOKING_STATUS: Record<string, { label: string; tone: Tone }> = {
  CONFIRMED: { label: 'Confirmada', tone: 'info' }, CANCELLED: { label: 'Cancelada', tone: 'neutral' },
  ATTENDED: { label: 'Asistió', tone: 'success' }, NO_SHOW: { label: 'No asistió', tone: 'danger' },
};
export const STAFF_ROLE: Record<string, string> = { TRAINER: 'Entrenador/a', RECEPTIONIST: 'Recepción', MANAGER: 'Gerencia', NUTRITIONIST: 'Nutricionista', ACCOUNTANT: 'Contabilidad', CLEANING: 'Servicios' };
export const USER_ROLE: Record<string, string> = { ADMIN: 'Administrador', STAFF: 'Personal', ACCOUNTANT: 'Contador', MEMBER: 'Miembro' };
export const GENDER: Record<string, string> = { FEMENINO: 'Femenino', MASCULINO: 'Masculino', OTRO: 'Otro' };
export const DIFFICULTY: Record<string, { label: string; tone: Tone }> = {
  BEGINNER: { label: 'Principiante', tone: 'success' }, INTERMEDIATE: { label: 'Intermedio', tone: 'warning' }, ADVANCED: { label: 'Avanzado', tone: 'danger' },
};
export const EVENT_TYPE: Record<string, { label: string; tone: Tone }> = {
  EVENT: { label: 'Evento', tone: 'brand' }, COMPETITION: { label: 'Competencia', tone: 'info' }, WORKSHOP: { label: 'Taller', tone: 'success' }, HOLIDAY: { label: 'Cierre', tone: 'neutral' },
};
export const NOTICE_TYPE: Record<string, { label: string; tone: Tone }> = {
  INFO: { label: 'Informativo', tone: 'info' }, WARNING: { label: 'Advertencia', tone: 'warning' }, URGENT: { label: 'Urgente', tone: 'danger' }, PROMO: { label: 'Promoción', tone: 'brand' },
};
export const NEWSLETTER_STATUS: Record<string, { label: string; tone: Tone }> = {
  DRAFT: { label: 'Borrador', tone: 'neutral' }, SCHEDULED: { label: 'Programado', tone: 'warning' }, SENT: { label: 'Enviado', tone: 'success' },
};
export const AUDIENCE: Record<string, string> = { ALL: 'Todos', MEMBERS: 'Miembros', STAFF: 'Equipo', ACTIVE_MEMBERS: 'Miembros activos', EXPIRED_MEMBERS: 'Miembros vencidos' };
export const MEAL_TYPE: Record<string, string> = { BREAKFAST: 'Desayuno', SNACK_AM: 'Media mañana', LUNCH: 'Almuerzo', SNACK_PM: 'Media tarde', DINNER: 'Cena' };
export const MEASUREMENT_TYPE: Record<string, string> = { WEIGHT: 'Peso', WAIST: 'Cintura', HEIGHT: 'Estatura', BODY_FAT: 'Grasa corporal', CHEST: 'Pecho', HIPS: 'Cadera', ARM: 'Brazo' };
export const ATTENDANCE_METHOD: Record<string, string> = { QR: 'QR', MANUAL: 'Manual', CARD: 'Tarjeta' };

export const toOptions = (map: Record<string, string | { label: string }>) =>
  Object.entries(map).map(([value, v]) => ({ value, label: typeof v === 'string' ? v : v.label }));

/** Paleta categórica para gráficas (misma luminosidad y croma, distinto matiz). */
export const CHART_COLORS = ['#7CB518', '#22A6B3', '#7C5CFC', '#F5875C', '#E06BB6', '#F5B700', '#3B82F6'];
