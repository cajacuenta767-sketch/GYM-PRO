import {
  Activity, Apple, Bell, BookOpen, CalendarDays, CalendarRange, ClipboardCheck, CreditCard, Dumbbell, History,
  KeyRound, LayoutDashboard, Mail, Megaphone, Newspaper, PieChart, Settings, ShoppingBag, Sparkles, Ticket, UserCog, Users, UsersRound, Wallet,
  type LucideIcon,
} from 'lucide-react';

export interface NavItem { label: string; to: string; icon: LucideIcon; children?: { label: string; to: string }[]; permission?: string; badge?: 'messages' }
export interface NavSection { title: string; items: NavItem[] }

export const NAV: NavSection[] = [
  {
    title: 'Principal',
    items: [
      { label: 'Tablero', to: '/', icon: LayoutDashboard },
      { label: 'Asistencia', to: '/asistencia', icon: ClipboardCheck, permission: 'attendance.read' },
    ],
  },
  {
    title: 'Miembros',
    items: [
      { label: 'Gestión de miembros', to: '/miembros', icon: Users, permission: 'members.read', children: [
        { label: 'Miembros', to: '/miembros' },
        { label: 'Miembros del equipo', to: '/equipo' },
        { label: 'Contadores', to: '/contadores' },
      ] },
      { label: 'Tipos de membresía', to: '/membresias', icon: Sparkles, permission: 'memberships.read' },
      { label: 'Grupos', to: '/grupos', icon: UsersRound, permission: 'groups.read' },
      { label: 'Historial de suscripción', to: '/suscripciones', icon: History, permission: 'subscriptions.read' },
    ],
  },
  {
    title: 'Entrenamiento',
    items: [
      { label: 'Clases y nutrición', to: '/clases', icon: CalendarDays, permission: 'classes.read', children: [
        { label: 'Lista de clases', to: '/clases' },
        { label: 'Horario semanal', to: '/clases/horario' },
        { label: 'Reserva de clases', to: '/clases/reservas' },
        { label: 'Horario de nutrición', to: '/clases/nutricion' },
      ] },
      { label: 'Actividades', to: '/actividades', icon: Activity, permission: 'activities.read' },
      { label: 'Ejercicios', to: '/ejercicios', icon: Dumbbell, permission: 'exercises.read' },
      { label: 'Eventos', to: '/eventos', icon: CalendarRange, permission: 'events.read' },
    ],
  },
  {
    title: 'Operación',
    items: [
      { label: 'Pagos', to: '/pagos', icon: CreditCard, permission: 'payments.read' },
      { label: 'Tienda y productos', to: '/tienda', icon: ShoppingBag, permission: 'store.read' },
      { label: 'Reportes', to: '/reportes', icon: PieChart, permission: 'reports.read' },
    ],
  },
  {
    title: 'Comunicación',
    items: [
      { label: 'Mensajes', to: '/mensajes', icon: Mail, badge: 'messages' },
      { label: 'Boletín informativo', to: '/boletines', icon: Newspaper, permission: 'newsletters.read' },
      { label: 'Avisos', to: '/avisos', icon: Megaphone, permission: 'notices.read' },
    ],
  },
  {
    title: 'Sistema',
    items: [
      { label: 'Configuración general', to: '/configuracion', icon: Settings, permission: 'settings.read' },
      { label: 'Control de acceso', to: '/acceso', icon: KeyRound, permission: 'access.read' },
    ],
  },
];

// Iconos usados en otras vistas (evita importar lucide en cada página para estos)
export const ICONS = { Apple, Bell, BookOpen, Ticket, UserCog, Wallet };
