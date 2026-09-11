import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { addDays, addMonths, endOfMonth, endOfWeek, format, isSameDay, isSameMonth, isToday, startOfMonth, startOfWeek, subMonths } from 'date-fns';
import { es } from 'date-fns/locale';
import { Cake, CalendarDays, ChevronLeft, ChevronRight, Clock, Dumbbell } from 'lucide-react';
import { get } from '@/lib/api';
import { cn } from '@/lib/utils';
import { Button, Card, CardHeader, Skeleton } from '@/components/ui';

interface CalItem { id: string; type: 'event' | 'birthday' | 'class'; title: string; date: string; color: string; allDay: boolean; time?: string; endTime?: string }

export function DashboardCalendar() {
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const [selected, setSelected] = useState<Date>(new Date());
  const [view, setView] = useState<'month' | 'week'>('month');

  const range = useMemo(() => {
    const from = view === 'month' ? startOfWeek(startOfMonth(month), { weekStartsOn: 1 }) : startOfWeek(selected, { weekStartsOn: 1 });
    const to = view === 'month' ? endOfWeek(endOfMonth(month), { weekStartsOn: 1 }) : endOfWeek(selected, { weekStartsOn: 1 });
    return { from, to };
  }, [month, selected, view]);

  const { data, isLoading } = useQuery({
    queryKey: ['calendar', range.from.toISOString(), range.to.toISOString()],
    queryFn: () => get<CalItem[]>('/dashboard/calendar', { from: range.from.toISOString(), to: range.to.toISOString() }),
  });

  const byDay = useMemo(() => {
    const map = new Map<string, CalItem[]>();
    (data ?? []).forEach((it) => { const k = format(new Date(it.date), 'yyyy-MM-dd'); map.set(k, [...(map.get(k) ?? []), it]); });
    return map;
  }, [data]);

  const days = useMemo(() => { const out: Date[] = []; for (let d = range.from; d <= range.to; d = addDays(d, 1)) out.push(d); return out; }, [range]);
  const selectedItems = byDay.get(format(selected, 'yyyy-MM-dd')) ?? [];

  const goToday = () => { const t = new Date(); setMonth(startOfMonth(t)); setSelected(t); };
  const prev = () => (view === 'month' ? setMonth(subMonths(month, 1)) : setSelected(addDays(selected, -7)));
  const next = () => (view === 'month' ? setMonth(addMonths(month, 1)) : setSelected(addDays(selected, 7)));

  return (
    <Card className="overflow-hidden">
      <CardHeader
        title={<span className="capitalize">{format(view === 'month' ? month : selected, view === 'month' ? 'MMMM yyyy' : "'Semana del' d 'de' MMMM", { locale: es })}</span>}
        description="Eventos, cumpleaños y clases programadas"
        action={
          <div className="flex items-center gap-1.5">
            <div className="hidden sm:inline-flex rounded-lg border border-line bg-surface-2 p-0.5">
              {(['month', 'week'] as const).map((v) => (
                <button key={v} onClick={() => setView(v)} className={cn('rounded-md px-2.5 py-1 text-[12px] font-medium transition-colors', view === v ? 'bg-surface text-ink shadow-card' : 'text-ink-2 hover:text-ink')}>{v === 'month' ? 'Mes' : 'Semana'}</button>
              ))}
            </div>
            <Button variant="outline" size="sm" onClick={goToday}>Hoy</Button>
            <Button variant="ghost" size="icon-sm" onClick={prev} aria-label="Anterior"><ChevronLeft className="h-4 w-4" /></Button>
            <Button variant="ghost" size="icon-sm" onClick={next} aria-label="Siguiente"><ChevronRight className="h-4 w-4" /></Button>
          </div>
        }
      />
      <div className="grid lg:grid-cols-[1fr_260px]">
        <div className="px-3 pb-4">
          <div className="grid grid-cols-7 text-center text-[11px] font-semibold uppercase tracking-wider text-ink-3 pb-2">
            {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((d) => <div key={d}>{d}</div>)}
          </div>
          {isLoading ? <Skeleton className="h-72" /> : (
            <div className="grid grid-cols-7 gap-1">
              {days.map((d) => {
                const items = byDay.get(format(d, 'yyyy-MM-dd')) ?? [];
                const inMonth = view === 'week' || isSameMonth(d, month);
                const sel = isSameDay(d, selected);
                return (
                  <button key={d.toISOString()} onClick={() => setSelected(d)}
                    className={cn('flex min-h-[48px] sm:min-h-[72px] flex-col items-stretch rounded-xl border p-1 sm:p-1.5 text-left transition-colors focus-ring', sel ? 'border-brand bg-brand-soft/60' : 'border-transparent hover:bg-surface-2', !inMonth && 'opacity-40', view === 'week' && 'min-h-[140px]')}>
                    <span className={cn('mb-1 inline-flex h-6 w-6 items-center justify-center rounded-full text-[12px] font-semibold', isToday(d) ? 'bg-side text-side-ink dark:bg-brand dark:text-[#14161C]' : 'text-ink-2')}>{format(d, 'd')}</span>
                    <div className="hidden space-y-0.5 sm:block">
                      {items.slice(0, view === 'week' ? 6 : 2).map((it) => (
                        <span key={it.id} className="block truncate rounded-md px-1.5 py-0.5 text-[10.5px] font-medium text-white" style={{ background: it.color }}>
                          {view === 'week' && it.time ? `${it.time} ` : ''}{it.title}
                        </span>
                      ))}
                      {items.length > (view === 'week' ? 6 : 2) && <span className="block text-[10.5px] font-semibold text-ink-3">+{items.length - (view === 'week' ? 6 : 2)} más</span>}
                    </div>
                    <div className="flex flex-wrap gap-0.5 sm:hidden">
                      {items.slice(0, 6).map((it) => <span key={it.id} className="h-1.5 w-1.5 rounded-full" style={{ background: it.color }} />)}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
        <aside className="border-t border-line bg-surface-2/50 p-4 lg:border-l lg:border-t-0">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-3">Agenda</p>
          <p className="mt-0.5 font-display text-[15px] font-semibold capitalize">{format(selected, "EEEE d 'de' MMMM", { locale: es })}</p>
          <ul className="mt-3 space-y-2">
            {selectedItems.length === 0 && <li className="rounded-xl border border-dashed border-line px-3 py-6 text-center text-[12.5px] text-ink-3">Nada programado para este día.</li>}
            {selectedItems.map((it) => (
              <li key={it.id} className="flex items-start gap-2.5 rounded-xl bg-surface p-2.5 border border-line">
                <span className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-white [&_svg]:h-3.5 [&_svg]:w-3.5" style={{ background: it.color }}>
                  {it.type === 'birthday' ? <Cake /> : it.type === 'class' ? <Dumbbell /> : <CalendarDays />}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-[13px] font-medium text-ink">{it.title}</span>
                  <span className="flex items-center gap-1 text-[11.5px] text-ink-3"><Clock className="h-3 w-3" />{it.allDay ? 'Todo el día' : it.time ? `${it.time} – ${it.endTime}` : format(new Date(it.date), 'HH:mm')}</span>
                </span>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </Card>
  );
}
