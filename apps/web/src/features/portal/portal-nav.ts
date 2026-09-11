import { Apple, CalendarDays, CalendarRange, Dumbbell, Home, Ticket, TrendingUp, Wallet } from 'lucide-react';

export const PORTAL_NAV = [
  { to: '/portal', label: 'Inicio', icon: Home, end: true },
  { to: '/portal/clases', label: 'Clases', icon: CalendarDays },
  { to: '/portal/reservas', label: 'Reservas', icon: Ticket },
  { to: '/portal/rutina', label: 'Mi rutina', icon: Dumbbell },
  { to: '/portal/nutricion', label: 'Nutrición', icon: Apple },
  { to: '/portal/progreso', label: 'Progreso', icon: TrendingUp },
  { to: '/portal/pagos', label: 'Pagos', icon: Wallet },
  { to: '/portal/eventos', label: 'Eventos', icon: CalendarRange },
];
