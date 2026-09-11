import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Clock, MapPin, User } from 'lucide-react';
import { toast } from 'sonner';
import { get, post } from '@/lib/api';
import { cn } from '@/lib/utils';
import { DAYS_ES, DAYS_SHORT_ES } from '@/lib/format';
import type { WeeklySlot } from '@/types';
import { Button, Dialog, PageHeader, Skeleton } from '@/components/ui';

const ORDER = [1, 2, 3, 4, 5, 6, 0];

export default function PortalClassesPage() {
  const qc = useQueryClient();
  const today = new Date().getDay();
  const [day, setDay] = useState(today);
  const [slot, setSlot] = useState<WeeklySlot | null>(null);
  const { data, isLoading } = useQuery({ queryKey: ['portal', 'weekly'], queryFn: () => get<{ dayOfWeek: number; slots: WeeklySlot[] }[]>('/portal/classes/weekly') });
  const slots = data?.find((d) => d.dayOfWeek === day)?.slots ?? [];

  const nextDate = useMemo(() => {
    if (!slot) return null;
    const d = new Date(); const diff = (day - d.getDay() + 7) % 7; d.setDate(d.getDate() + diff);
    const [h, m] = slot.startTime.split(':').map(Number); d.setHours(h, m, 0, 0);
    if (d < new Date()) d.setDate(d.getDate() + 7);
    return d;
  }, [slot, day]);

  const book = useMutation({
    mutationFn: () => post<any>('/portal/bookings', { classId: slot!.classId, scheduleId: slot!.scheduleId, date: nextDate!.toISOString(), waitlist: true }),
    onSuccess: (b) => { toast.success(b.status === 'WAITLISTED' ? 'Clase llena: quedaste en lista de espera' : 'Reserva confirmada'); setSlot(null); qc.invalidateQueries({ queryKey: ['portal'] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="animate-slide-up">
      <PageHeader title="Horario de clases" description="Elige un día y reserva tu cupo. Si la clase está llena, entras en lista de espera." />
      <div className="mb-4 flex gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
        {ORDER.map((d) => <button key={d} onClick={() => setDay(d)} className={cn('shrink-0 rounded-xl px-3.5 py-2 text-[13px] font-semibold transition-colors', day === d ? 'bg-side text-side-ink dark:bg-brand dark:text-[#14161C]' : 'bg-surface border border-line text-ink-2 hover:text-ink')}>{DAYS_SHORT_ES[d]}{d === today && <span className="ml-1 text-[10px] opacity-70">hoy</span>}</button>)}
      </div>
      {isLoading ? <Skeleton className="h-64" /> : slots.length === 0 ? <div className="card p-10 text-center text-ink-3">No hay clases programadas el {DAYS_ES[day].toLowerCase()}.</div> : (
        <ul className="space-y-2">
          {slots.map((s) => (
            <li key={s.scheduleId}>
              <button onClick={() => setSlot(s)} className="card flex w-full items-center gap-4 p-4 text-left transition-shadow hover:shadow-pop focus-ring">
                <div className="w-14 text-center"><p className="font-display text-[16px] font-bold leading-tight">{s.startTime}</p><p className="text-[11px] text-ink-3">{s.endTime}</p></div>
                <span className="h-12 w-1.5 rounded-full" style={{ background: s.color }} />
                <div className="min-w-0 flex-1"><p className="font-semibold">{s.name}</p><p className="truncate text-[12.5px] text-ink-2">{s.trainer ?? 'Instructor por confirmar'} · {s.location}</p></div>
                <span className="text-[12px] text-ink-3">{s.capacity} cupos</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      <Dialog open={!!slot} onOpenChange={(o) => !o && setSlot(null)} title={slot?.name ?? ''} description={nextDate ? `Próxima sesión: ${DAYS_ES[day]} ${nextDate.toLocaleDateString('es-CO')} · ${slot?.startTime}` : ''} size="sm"
        footer={<><Button variant="ghost" onClick={() => setSlot(null)}>Cerrar</Button><Button onClick={() => book.mutate()} loading={book.isPending}>Reservar cupo</Button></>}>
        {slot && <div className="space-y-2 text-[13.5px] text-ink-2"><p className="flex items-center gap-2"><User className="h-4 w-4" />{slot.trainer ?? 'Instructor por confirmar'}</p><p className="flex items-center gap-2"><MapPin className="h-4 w-4" />{slot.location}</p><p className="flex items-center gap-2"><Clock className="h-4 w-4" />{slot.startTime} – {slot.endTime} · capacidad {slot.capacity}</p></div>}
      </Dialog>
    </div>
  );
}
