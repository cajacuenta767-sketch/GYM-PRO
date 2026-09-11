import { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate, Outlet, RouterProvider } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth.store';
import { AppShell } from '@/components/layout/app-shell';
import { Skeleton } from '@/components/ui';

const LoginPage = lazy(() => import('@/features/auth/login-page'));
const DashboardPage = lazy(() => import('@/features/dashboard/dashboard-page'));
const MembersPage = lazy(() => import('@/features/members/members-page'));
const MemberDetailPage = lazy(() => import('@/features/members/member-detail-page'));
const StaffPage = lazy(() => import('@/features/staff/staff-page'));
const AccountantsPage = lazy(() => import('@/features/staff/accountants-page'));
const MembershipsPage = lazy(() => import('@/features/memberships/memberships-page'));
const GroupsPage = lazy(() => import('@/features/groups/groups-page'));
const SubscriptionsPage = lazy(() => import('@/features/subscriptions/subscriptions-page'));
const ClassesPage = lazy(() => import('@/features/classes/classes-page'));
const SchedulePage = lazy(() => import('@/features/classes/schedule-page'));
const BookingsPage = lazy(() => import('@/features/classes/bookings-page'));
const NutritionPage = lazy(() => import('@/features/classes/nutrition-page'));
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
const SettingsPage = lazy(() => import('@/features/settings/settings-page'));
const AccessPage = lazy(() => import('@/features/access/access-page'));
const ProfilePage = lazy(() => import('@/features/auth/profile-page'));

function Protected() {
  const token = useAuthStore((s) => s.token);
  return token ? <Outlet /> : <Navigate to="/login" replace />;
}
function PublicOnly() {
  const token = useAuthStore((s) => s.token);
  return token ? <Navigate to="/" replace /> : <Outlet />;
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
  { element: <PublicOnly />, children: [{ path: '/login', element: <S><LoginPage /></S> }] },
  {
    element: <Protected />,
    children: [
      {
        element: <AppShell />,
        children: [
          { path: '/', element: <S><DashboardPage /></S> },
          { path: '/miembros', element: <S><MembersPage /></S> },
          { path: '/miembros/:id', element: <S><MemberDetailPage /></S> },
          { path: '/equipo', element: <S><StaffPage /></S> },
          { path: '/contadores', element: <S><AccountantsPage /></S> },
          { path: '/membresias', element: <S><MembershipsPage /></S> },
          { path: '/grupos', element: <S><GroupsPage /></S> },
          { path: '/suscripciones', element: <S><SubscriptionsPage /></S> },
          { path: '/clases', element: <S><ClassesPage /></S> },
          { path: '/clases/horario', element: <S><SchedulePage /></S> },
          { path: '/clases/reservas', element: <S><BookingsPage /></S> },
          { path: '/clases/nutricion', element: <S><NutritionPage /></S> },
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
          { path: '/configuracion', element: <S><SettingsPage /></S> },
          { path: '/acceso', element: <S><AccessPage /></S> },
          { path: '/perfil', element: <S><ProfilePage /></S> },
          { path: '*', element: <Navigate to="/" replace /> },
        ],
      },
    ],
  },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
