import { format, formatDistanceToNow, isToday, isYesterday, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

const toDate = (d: string | Date | null | undefined) => (d ? (typeof d === 'string' ? parseISO(d) : d) : null);

export const fmtMoney = (n: number | null | undefined, currency = 'USD') =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency, maximumFractionDigits: 0 }).format(n ?? 0);

export const fmtMoneyDec = (n: number | null | undefined, currency = 'USD') =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency, minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n ?? 0);

export const fmtNumber = (n: number | null | undefined) => new Intl.NumberFormat('es-CO').format(n ?? 0);

export const fmtDate = (d: string | Date | null | undefined, pattern = 'd MMM yyyy') => {
  const date = toDate(d);
  return date ? format(date, pattern, { locale: es }) : '—';
};

export const fmtDateTime = (d: string | Date | null | undefined) => fmtDate(d, "d MMM yyyy · HH:mm");
export const fmtTime = (d: string | Date | null | undefined) => fmtDate(d, 'HH:mm');

export const fmtRelative = (d: string | Date | null | undefined) => {
  const date = toDate(d);
  if (!date) return '—';
  if (isToday(date)) return `Hoy · ${format(date, 'HH:mm')}`;
  if (isYesterday(date)) return `Ayer · ${format(date, 'HH:mm')}`;
  return formatDistanceToNow(date, { addSuffix: true, locale: es });
};

export const toInputDate = (d: string | Date | null | undefined) => {
  const date = toDate(d);
  return date ? format(date, 'yyyy-MM-dd') : '';
};
export const toInputDateTime = (d: string | Date | null | undefined) => {
  const date = toDate(d);
  return date ? format(date, "yyyy-MM-dd'T'HH:mm") : '';
};

export const daysUntil = (d: string | Date | null | undefined) => {
  const date = toDate(d);
  if (!date) return null;
  return Math.ceil((date.getTime() - Date.now()) / 86_400_000);
};

export const age = (birth: string | Date | null | undefined) => {
  const b = toDate(birth);
  if (!b) return null;
  const now = new Date();
  let a = now.getFullYear() - b.getFullYear();
  if (now < new Date(now.getFullYear(), b.getMonth(), b.getDate())) a--;
  return a;
};

export const DAYS_ES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
export const DAYS_SHORT_ES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
