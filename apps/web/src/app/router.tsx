import { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate, Outlet, RouterProvider } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth.store';
import { AppShell } from '@/components/layout/app-shell';
import { PortalShell } from '@/features/portal/portal-shell';
import { Skeleton } from '@/components/ui';
import { ErrorPage } from '@/components/error-page';

const LoginPage = lazy(() => import('@/features/auth/login-page'));
const PublicPage = lazy(() => import('@/features/public/public-page'));
const DashboardPage = lazy(() => import('@/features/dashboard/dashboard-page'));
const MembersPage = lazy(() => import('@/features/members/members-page'));
const MemberDetailPage = lazy(() => import('@/features/members/member-detail-page'));
const StaffPage = lazy(() => import('@/features/staff/staff-page'));
const AccountantsPage = lazy(() => import('@/features/staff/accountants-page'));
const AgendaPage = lazy(() => import('@/features/staff/agenda-page'));
const MembershipsPage = lazy(() => import('@/features/memberships/memberships-page'));
const GroupsPage = lazy(() => import('@/features/groups/groups-page'));
const SubscriptionsPage = lazy(() => import('@/features/subscriptions/subscriptions-page'));
const ClassesPage = lazy(() => import('@/features/classes/classes-page'));
const SchedulePage = lazy(() => import('@/features/classes/schedule-page'));
const BookingsPage = lazy(() => import('@/features/classes/bookings-page'));
const NutritionPage = lazy(() => import('@/features/classes/nutrition-page'));
const RoutinesPage = lazy(() => import('@/features/routines/routines-page'));
const ActivitiesPage = lazy(() => import('@/features/activities/activities-page'));
const ExercisesPage = lazy(() => import('@/features/exercises/exercises-page'));
const EventsPage = lazy(() => import('@/features/events/events-page'));
const AttendancePage = lazy(() => import('@/features/attendance/attendance-page'));
const PaymentsPage = lazy(() => import('@/features/payments/payments-page'));
const StorePage = lazy(() => import('@/features/store/store-page'));
const ReportsPage = lazy(() => import('@/features/reports/reports-page'));
const MessagesPage = lazy(() => import('@/features/messages/messages-page'));
const NewslettersPage = lazy(() => import('@/features/newsletters/newsletters-page'));
const NoticesPage = lazy(() => import('@/features/notices/notices-page'));
const NotificationsPage = lazy(() => import('@/features/notifications/notifications-page'));
const SettingsPage = lazy(() => import('@/features/settings/settings-page'));
const SetupWizardPage = lazy(() => import('@/features/settings/setup-wizard-page'));
const AccessPage = lazy(() => import('@/features/access/access-page'));
const ProfilePage = lazy(() => import('@/features/auth/profile-page'));

const PortalHome = lazy(() => import('@/features/portal/pages/home-page'));
const PortalClasses = lazy(() => import('@/features/portal/pages/classes-page'));
const PortalBookings = lazy(() => import('@/features/portal/pages/bookings-page'));
const PortalNutrition = lazy(() => import('@/features/portal/pages/nutrition-page'));
const PortalRoutine = lazy(() => import('@/features/portal/pages/routine-page'));
const PortalProgress = lazy(() => import('@/features/portal/pages/progress-page'));
const PortalPayments = lazy(() => import('@/features/portal/pages/payments-page'));
const PortalCheckout = lazy(() => import('@/features/portal/pages/checkout-page'));
const PortalEvents = lazy(() => import('@/features/portal/pages/events-page'));
const PortalProfile = lazy(() => import('@/features/portal/pages/profile-page'));
const PortalNotifications = lazy(() => import('@/features/portal/pages/notifications-page'));

function StaffOnly() {
  const { token, user } = useAuthStore();
  if (!token) return <Navigate to="/login" replace />;
  if (user?.role === 'MEMBER') return <Navigate to="/portal" replace />;
  return <Outlet />;
}
function MemberOnly() {
  const { token, user } = useAuthStore();
  if (!token) return <Navigate to="/login" replace />;
  if (user?.role !== 'MEMBER') return <Navigate to="/" replace />;
  return <Outlet />;
}
function PublicOnly() {
  const { token, user } = useAuthStore();
  return token ? <Navigate to={user?.role === 'MEMBER' ? '/portal' : '/'} replace /> : <Outlet />;
}

const Fallback = () => (
  <div className="space-y-4 animate-fade-in">
    <Skeleton className="h-8 w-64" />
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28" />)}</div>
    <Skeleton className="h-96" />
  </div>
);
const S = ({ children }: { children: React.ReactNode }) => <Suspense fallback={<Fallback />}>{children}</Suspense>;

const router = createBrowserRouter([
  { path: '/publico', element: <S><PublicPage /></S>, errorElement: <ErrorPage /> },
  { element: <PublicOnly />, errorElement: <ErrorPage />, children: [{ path: '/login', element: <S><LoginPage /></S> }] },
  {
    element: <StaffOnly />,
    errorElement: <ErrorPage />,
    children: [
      {
        element: <AppShell />,
        children: [
          { path: '/', element: <S><DashboardPage /></S> },
          { path: '/miembros', element: <S><MembersPage /></S> },
          { path: '/miembros/:id', element: <S><MemberDetailPage /></S> },
          { path: '/equipo', element: <S><StaffPage /></S> },
          { path: '/mi-agenda', element: <S><AgendaPage /></S> },
          { path: '/contadores', element: <S><AccountantsPage /></S> },
          { path: '/membresias', element: <S><MembershipsPage /></S> },
          { path: '/grupos', element: <S><GroupsPage /></S> },
          { path: '/suscripciones', element: <S><SubscriptionsPage /></S> },
          { path: '/clases', element: <S><ClassesPage /></S> },
          { path: '/clases/horario', element: <S><SchedulePage /></S> },
          { path: '/clases/reservas', element: <S><BookingsPage /></S> },
          { path: '/clases/nutricion', element: <S><NutritionPage /></S> },
          { path: '/rutinas', element: <S><RoutinesPage /></S> },
          { path: '/actividades', element: <S><ActivitiesPage /></S> },
          { path: '/ejercicios', element: <S><ExercisesPage /></S> },
          { path: '/eventos', element: <S><EventsPage /></S> },
          { path: '/asistencia', element: <S><AttendancePage /></S> },
          { path: '/pagos', element: <S><PaymentsPage /></S> },
          { path: '/tienda', element: <S><StorePage /></S> },
          { path: '/reportes', element: <S><ReportsPage /></S> },
          { path: '/mensajes', element: <S><MessagesPage /></S> },
          { path: '/boletines', element: <S><NewslettersPage /></S> },
          { path: '/avisos', element: <S><NoticesPage /></S> },
          { path: '/notificaciones', element: <S><NotificationsPage /></S> },
          { path: '/configuracion', element: <S><SettingsPage /></S> },
          { path: '/configuracion/inicial', element: <S><SetupWizardPage /></S> },
          { path: '/acceso', element: <S><AccessPage /></S> },
          { path: '/perfil', element: <S><ProfilePage /></S> },
          { path: '*', element: <Navigate to="/" replace /> },
        ],
      },
    ],
  },
  {
    element: <MemberOnly />,
    errorElement: <ErrorPage />,
    children: [
      {
        element: <PortalShell />,
        children: [
          { path: '/portal', element: <S><PortalHome /></S> },
          { path: '/portal/clases', element: <S><PortalClasses /></S> },
          { path: '/portal/reservas', element: <S><PortalBookings /></S> },
          { path: '/portal/nutricion', element: <S><PortalNutrition /></S> },
          { path: '/portal/rutina', element: <S><PortalRoutine /></S> },
          { path: '/portal/progreso', element: <S><PortalProgress /></S> },
          { path: '/portal/pagos', element: <S><PortalPayments /></S> },
          { path: '/portal/pago/exito', element: <S><PortalCheckout /></S> },
          { path: '/portal/pago/:ref', element: <S><PortalCheckout /></S> },
          { path: '/portal/eventos', element: <S><PortalEvents /></S> },
          { path: '/portal/perfil', element: <S><PortalProfile /></S> },
          { path: '/portal/notificaciones', element: <S><PortalNotifications /></S> },
          { path: '/portal/*', element: <Navigate to="/portal" replace /> },
        ],
      },
    ],
  },
]);

export function AppRouter() { return <RouterProvider router={router} />; }
