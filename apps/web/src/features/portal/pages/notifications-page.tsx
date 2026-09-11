import { NotificationsList } from '@/features/notifications/notifications-list';
import { PageHeader } from '@/components/ui';

export default function PortalNotificationsPage() {
  return <div className="animate-slide-up"><PageHeader title="Notificaciones" description="Recordatorios de reservas, pagos y avisos importantes." /><NotificationsList linkBase="" /></div>;
}
