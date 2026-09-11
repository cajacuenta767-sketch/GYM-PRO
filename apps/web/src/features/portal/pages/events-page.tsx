import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, MapPin, Users } from 'lucide-react';
import { toast } from 'sonner';
import { get, post } from '@/lib/api';
import { fmtDate, fmtDateTime, fmtMoney } from '@/lib/format';
import { EVENT_TYPE } from '@/lib/labels';
import { Badge, Button, Card, EmptyState, PageHeader, Skeleton, StatusBadge } from '@/components/ui';

export default function PortalEventsPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['portal', 'events'], queryFn: () => get<any[]>('/portal/events') });
  const rsvp = useMutation({ mutationFn: ({ id, status }: { id: string; status: string }) => post(`/portal/events/${id}/rsvp`, { status }), onSuccess: () => { toast.success('Respuesta guardada'); qc.invalidateQueries({ queryKey: ['portal', 'events'] }); } });
  return (
    <div className="animate-slide-up">
      <PageHeader title="Eventos" description="Competencias, talleres y jornadas especiales. Confirma tu asistencia." />
      {isLoading ? <Skeleton className="h-64" /> : !data?.length ? <Card><EmptyState title="Sin eventos próximos" /></Card> : (
        <div className="grid gap-4 sm:grid-cols-2">
          {data.map((e) => (
            <Card key={e.id} className="overflow-hidden"><div className="h-2" style={{ background: e.color }} /><div className="p-5">
              <div className="flex items-start justify-between gap-2"><StatusBadge value={e.type} map={EVENT_TYPE} /><span className="text-[12px] text-ink-3 inline-flex items-center gap-1"><Users className="h-3.5 w-3.5" />{e._count.rsvps}{e.capacity ? ` / ${e.capacity}` : ''}</span></div>
              <h3 className="mt-2 font-display text-[16px] font-semibold">{e.title}</h3>
              <p className="text-[12.5px] text-ink-2">{fmtDateTime(e.startsAt)}{e.endsAt ? ` → ${fmtDate(e.endsAt, 'HH:mm')}` : ''}</p>
              <p className="inline-flex items-center gap-1 text-[12.5px] text-ink-3"><MapPin className="h-3.5 w-3.5" />{e.location}</p>
              {e.description && <p className="mt-2 text-[13px] text-ink-2">{e.description}</p>}
              <div className="mt-4 flex items-center justify-between"><span className="text-[13px] font-semibold">{e.fee ? fmtMoney(e.fee) : <Badge tone="success">Gratis</Badge>}</span>
                {e.myStatus === 'GOING' ? <Button size="sm" variant="secondary" onClick={() => rsvp.mutate({ id: e.id, status: 'DECLINED' })}><Check className="h-4 w-4 text-success" />Asistiré</Button> : <Button size="sm" onClick={() => rsvp.mutate({ id: e.id, status: 'GOING' })}>Confirmar asistencia</Button>}
              </div>
            </div></Card>
          ))}
        </div>
      )}
    </div>
  );
}
