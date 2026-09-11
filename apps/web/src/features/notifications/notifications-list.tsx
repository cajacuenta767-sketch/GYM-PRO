import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Bell, Cake, CalendarClock, CheckCheck, CreditCard, Package, Ticket } from 'lucide-react';
import { patch } from '@/lib/api';
import { useNotifications } from './hooks';
import { cn } from '@/lib/utils';
import { fmtRelative } from '@/lib/format';
import { Button, Card, EmptyState, Skeleton } from '@/components/ui';

export interface AppNotification { id: string; type: string; title: string; body: string; link?: string | null; readAt?: string | null; createdAt: string }

const ICONS: Record<string, React.ReactNode> = { BOOKING: <Ticket />, PAYMENT: <CreditCard />, EXPIRING: <CalendarClock />, BIRTHDAY: <Cake />, STOCK: <Package /> };
const TONES: Record<string, string> = { BOOKING: 'bg-info-soft text-info-ink', PAYMENT: 'bg-success-soft text-success-ink', EXPIRING: 'bg-warning-soft text-warning-ink', BIRTHDAY: 'bg-[#FCE7F3] text-[#BE185D]', STOCK: 'bg-danger-soft text-danger-ink' };

export function NotificationsList({ compact, linkBase = '' }: { compact?: boolean; linkBase?: string }) {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { data, isLoading } = useNotifications(compact ? 8 : 40);
  const invalidate = () => qc.invalidateQueries({ queryKey: ['notifications'] });
  const read = useMutation({ mutationFn: (id: string) => patch(`/notifications/${id}/read`), onSuccess: invalidate });
  const readAll = useMutation({ mutationFn: () => patch('/notifications/read-all'), onSuccess: invalidate });
  const rows = data?.data ?? [];
  const unread = rows.filter((n) => !n.readAt).length;

  const open = (n: AppNotification) => { if (!n.readAt) read.mutate(n.id); if (n.link) navigate(linkBase + n.link); };

  const body = (
    <>
      {isLoading && <div className="space-y-3 p-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10" />)}</div>}
      {!isLoading && rows.length === 0 && <EmptyState icon={<Bell />} title="Sin notificaciones" description="Aquí verás reservas, pagos y recordatorios." className={compact ? 'py-8' : undefined} />}
      <ul className="divide-y divide-line">
        {rows.map((n) => (
          <li key={n.id}>
            <button onClick={() => open(n)} className={cn('flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-surface-2', !n.readAt && 'bg-brand-soft/30')}>
              <span className={cn('mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg [&_svg]:h-4 [&_svg]:w-4', TONES[n.type] ?? 'bg-surface-3 text-ink-2')}>{ICONS[n.type] ?? <Bell />}</span>
              <span className="min-w-0 flex-1"><span className={cn('block truncate text-[13px]', n.readAt ? 'font-medium text-ink' : 'font-bold text-ink')}>{n.title}</span><span className="block text-[12.5px] text-ink-2 line-clamp-2">{n.body}</span><span className="block text-[11px] text-ink-3">{fmtRelative(n.createdAt)}</span></span>
              {!n.readAt && <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-brand" />}
            </button>
          </li>
        ))}
      </ul>
    </>
  );

  if (compact) return body;
  return (
    <Card>
      <div className="flex items-center justify-between border-b border-line px-4 py-3"><p className="text-[13px] text-ink-2">{unread ? <><b className="text-ink">{unread}</b> sin leer</> : 'Todo leído'}</p><Button variant="ghost" size="sm" onClick={() => readAll.mutate()} disabled={!unread}><CheckCheck className="h-4 w-4" />Marcar todo como leído</Button></div>
      {body}
    </Card>
  );
}
