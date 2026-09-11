import { NotificationsList } from './notifications-list';
import { PageHeader } from '@/components/ui';

export default function NotificationsPage() {
  return <div className="animate-slide-up"><PageHeader eyebrow="Comunicación" title="Notificaciones" description="Alertas del sistema: pagos en línea, vencimientos, listas de espera y stock." /><NotificationsList /></div>;
}
