import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { CalendarDays, MapPin, X } from 'lucide-react';
import { toast } from 'sonner';
import { del, get } from '@/lib/api';
import { fmtDateTime } from '@/lib/format';
import { BOOKING_STATUS } from '@/lib/labels';
import type { Booking } from '@/types';
import { Button, Card, CardHeader, EmptyState, PageHeader, Skeleton, StatusBadge } from '@/components/ui';

export default function PortalBookingsPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['portal', 'bookings'], queryFn: () => get<{ upcoming: Booking[]; past: Booking[] }>('/portal/bookings') });
  const cancel = useMutation({ mutationFn: (id: string) => del(`/portal/bookings/${id}`), onSuccess: () => { toast.success('Reserva cancelada'); qc.invalidateQueries({ queryKey: ['portal'] }); }, onError: (e: Error) => toast.error(e.message) });

  const Row = ({ b, cancellable }: { b: Booking; cancellable?: boolean }) => (
    <li className="flex items-center gap-3 px-4 py-3">
      <span className="h-10 w-1.5 rounded-full" style={{ background: b.class?.color }} />
      <div className="min-w-0 flex-1"><p className="truncate font-semibold">{b.class?.name}</p><p className="text-[12.5px] text-ink-2">{fmtDateTime(b.date)}</p><p className="inline-flex items-center gap-1 text-[12px] text-ink-3"><MapPin className="h-3 w-3" />{b.class?.location}</p></div>
      <StatusBadge value={b.status} map={BOOKING_STATUS} />
      {cancellable && <Button variant="ghost" size="icon-sm" aria-label="Cancelar" onClick={() => cancel.mutate(b.id)}><X className="h-4 w-4" /></Button>}
    </li>
  );

  return (
    <div className="animate-slide-up space-y-5">
      <PageHeader title="Mis reservas" description="Cancela con antelación para liberar el cupo a otra persona." actions={<Link to="/portal/clases"><Button><CalendarDays className="h-4 w-4" />Reservar clase</Button></Link>} />
      {isLoading ? <Skeleton className="h-64" /> : (
        <>
          <Card><CardHeader title="Próximas" />{data?.upcoming.length ? <ul className="divide-y divide-line">{data.upcoming.map((b) => <Row key={b.id} b={b} cancellable />)}</ul> : <EmptyState title="Sin reservas próximas" description="Reserva desde el horario de clases." />}</Card>
          <Card><CardHeader title="Historial" />{data?.past.length ? <ul className="divide-y divide-line">{data.past.slice(0, 15).map((b) => <Row key={b.id} b={b} />)}</ul> : <EmptyState title="Aún no tienes historial" />}</Card>
        </>
      )}
    </div>
  );
}
