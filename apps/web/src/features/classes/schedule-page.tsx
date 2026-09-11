import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Clock, List, MapPin, Ticket, User } from 'lucide-react';
import { toast } from 'sonner';
import { get, post } from '@/lib/api';
import { cn } from '@/lib/utils';
import { DAYS_ES, DAYS_SHORT_ES } from '@/lib/format';
import type { WeeklySlot } from '@/types';
import { Button, Card, Dialog, PageHeader, Skeleton } from '@/components/ui';
import { AutoForm, type FieldConfig } from '@/components/auto-form';

const START = 5, END = 23, HOUR_PX = 52;
const ORDER = [1, 2, 3, 4, 5, 6, 0];
const toMin = (t: string) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };

/** Distribuye las clases solapadas de un día en columnas paralelas. */
function layout(slots: WeeklySlot[]) {
  const sorted = [...slots].sort((a, b) => toMin(a.startTime) - toMin(b.startTime));
  const placed: { slot: WeeklySlot; col: number; cols: number; group: number }[] = [];
  let group = -1, groupEnd = -1;
  for (const s of sorted) {
    const start = toMin(s.startTime), end = toMin(s.endTime);
    if (start >= groupEnd) { group++; groupEnd = end; } else groupEnd = Math.max(groupEnd, end);
    const same = placed.filter((p) => p.group === group);
    const used = new Set(same.filter((p) => toMin(p.slot.endTime) > start).map((p) => p.col));
    let col = 0; while (used.has(col)) col++;
    placed.push({ slot: s, col, cols: 1, group });
  }
  for (const p of placed) p.cols = Math.max(...placed.filter((x) => x.group === p.group).map((x) => x.col)) + 1;
  return placed;
}

export default function SchedulePage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [slot, setSlot] = useState<(WeeklySlot & { dayOfWeek: number }) | null>(null);
  const [booking, setBooking] = useState(false);
  const { data, isLoading } = useQuery({ queryKey: ['classes', 'weekly'], queryFn: () => get<{ dayOfWeek: number; slots: WeeklySlot[] }[]>('/classes/weekly') });

  const nextDate = useMemo(() => {
    if (!slot) return '';
    const d = new Date(); const diff = (slot.dayOfWeek - d.getDay() + 7) % 7; d.setDate(d.getDate() + diff);
    const [h, m] = slot.startTime.split(':').map(Number); d.setHours(h, m, 0, 0);
    if (d < new Date()) d.setDate(d.getDate() + 7);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }, [slot]);

  const book = useMutation({
    mutationFn: (v: any) => post('/bookings', { ...v, classId: slot!.classId, scheduleId: slot!.scheduleId }),
    onSuccess: () => { toast.success('Reserva registrada'); setBooking(false); setSlot(null); qc.invalidateQueries({ queryKey: ['/bookings'] }); },
    onError: (e: Error) => toast.error(e.message),
  });
  const bookingFields: FieldConfig[] = [
    { name: 'memberId', label: 'Miembro', type: 'select', source: 'members', required: true, colSpan: 2 },
    { name: 'date', label: 'Fecha y hora', type: 'datetime', required: true },
    { name: 'paid', label: 'Pagado', type: 'switch' },
  ];

  const hours = Array.from({ length: END - START + 1 }, (_, i) => START + i);

  return (
    <div className="animate-slide-up">
      <PageHeader eyebrow="Entrenamiento" title="Horario de clases" description="Vista semanal de todas las clases activas. Haz clic en una clase para ver detalles o reservar." actions={<Button variant="outline" onClick={() => navigate('/clases')}><List className="h-4 w-4" />Lista de clases</Button>} />

      {isLoading ? <Skeleton className="h-[600px] rounded-2xl" /> : (
        <>
          {/* Escritorio: línea de tiempo */}
          <Card className="hidden md:block overflow-hidden">
            <div className="overflow-x-auto scrollbar-thin">
              <div className="min-w-[900px]">
                <div className="grid border-b border-line bg-surface-2/60" style={{ gridTemplateColumns: '64px repeat(7, 1fr)' }}>
                  <div />
                  {ORDER.map((d) => {
                    const today = new Date().getDay() === d;
                    return <div key={d} className={cn('border-l border-line px-3 py-2.5 text-center text-[12px] font-semibold uppercase tracking-wider', today ? 'text-brand-ink' : 'text-ink-3')}>{DAYS_ES[d]}{today && <span className="ml-1.5 rounded-md bg-brand px-1.5 text-[10px] text-[#14161C]">hoy</span>}</div>;
                  })}
                </div>
                <div className="relative grid" style={{ gridTemplateColumns: '64px repeat(7, 1fr)', height: hours.length * HOUR_PX }}>
                  {/* Horas */}
                  <div className="relative">
                    {hours.map((h, i) => <div key={h} className="absolute right-2 -translate-y-1/2 text-[11px] font-medium text-ink-3" style={{ top: i * HOUR_PX }}>{String(h).padStart(2, '0')}:00</div>)}
                  </div>
                  {ORDER.map((d) => {
                    const slots = data?.find((x) => x.dayOfWeek === d)?.slots ?? [];
                    return (
                      <div key={d} className="relative border-l border-line">
                        {hours.map((h, i) => <div key={h} className="absolute inset-x-0 border-t border-line/70" style={{ top: i * HOUR_PX }} />)}
                        {layout(slots).map(({ slot: s, col, cols }) => {
                          const top = ((toMin(s.startTime) - START * 60) / 60) * HOUR_PX;
                          const height = Math.max(26, ((toMin(s.endTime) - toMin(s.startTime)) / 60) * HOUR_PX - 3);
                          const width = 100 / cols;
                          return (
                            <button key={s.scheduleId} onClick={() => setSlot({ ...s, dayOfWeek: d })}
                              className="absolute overflow-hidden rounded-lg px-2 py-1 text-left text-white shadow-card transition-transform hover:z-10 hover:scale-[1.02] focus-ring"
                              style={{ top, height, background: s.color, left: `calc(${col * width}% + 3px)`, width: `calc(${width}% - 6px)` }}>
                              <p className="truncate text-[12px] font-semibold leading-tight">{s.name}</p>
                              <p className="truncate text-[10.5px] opacity-90">{s.startTime} – {s.endTime}</p>
                              {height > 44 && <p className="truncate text-[10.5px] opacity-80">{s.trainer}</p>}
                            </button>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </Card>

          {/* Móvil: lista por día */}
          <div className="space-y-4 md:hidden">
            {ORDER.map((d) => {
              const slots = data?.find((x) => x.dayOfWeek === d)?.slots ?? [];
              return (
                <Card key={d} className="p-4">
                  <p className="font-display text-[14px] font-semibold">{DAYS_ES[d]}</p>
                  {slots.length === 0 ? <p className="mt-1 text-[12.5px] text-ink-3">Sin clases</p> : (
                    <ul className="mt-2 space-y-1.5">{slots.map((s) => (
                      <li key={s.scheduleId}><button onClick={() => setSlot({ ...s, dayOfWeek: d })} className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-white" style={{ background: s.color }}><span className="text-[12px] font-semibold tabular-nums">{s.startTime}</span><span className="flex-1 truncate text-[13px] font-medium">{s.name}</span><span className="text-[11px] opacity-90">{s.endTime}</span></button></li>
                    ))}</ul>
                  )}
                </Card>
              );
            })}
          </div>
        </>
      )}

      <Dialog open={!!slot && !booking} onOpenChange={(o) => !o && setSlot(null)} title={slot?.name ?? ''} description={slot ? `${DAYS_SHORT_ES[slot.dayOfWeek]} · ${slot.startTime} – ${slot.endTime}` : ''} size="sm"
        footer={<><Button variant="ghost" onClick={() => setSlot(null)}>Cerrar</Button><Button onClick={() => setBooking(true)}><Ticket className="h-4 w-4" />Reservar cupo</Button></>}>
        {slot && (
          <div className="space-y-2 text-[13.5px]">
            <p className="flex items-center gap-2 text-ink-2"><User className="h-4 w-4" />{slot.trainer ?? 'Sin instructor'}</p>
            <p className="flex items-center gap-2 text-ink-2"><MapPin className="h-4 w-4" />{slot.location ?? 'Sin ubicación'}</p>
            <p className="flex items-center gap-2 text-ink-2"><Clock className="h-4 w-4" />Capacidad: {slot.capacity} personas</p>
          </div>
        )}
      </Dialog>
      <Dialog open={booking} onOpenChange={(o) => !o && setBooking(false)} title={`Reservar · ${slot?.name ?? ''}`} footer={<><Button variant="ghost" onClick={() => setBooking(false)}>Cancelar</Button><Button type="submit" form="book-form" loading={book.isPending}>Confirmar reserva</Button></>}>
        <AutoForm id="book-form" fields={bookingFields} defaultValues={{ date: nextDate, paid: true }} onSubmit={(v) => book.mutate(v)} />
      </Dialog>
    </div>
  );
}
