import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Dumbbell, Timer } from 'lucide-react';
import { get } from '@/lib/api';
import { cn } from '@/lib/utils';
import { DAYS_ES, DAYS_SHORT_ES, fmtDate } from '@/lib/format';
import { DIFFICULTY, ROUTINE_GOAL } from '@/lib/labels';
import { Badge, Card, EmptyState, PageHeader, Skeleton, StatusBadge } from '@/components/ui';

export default function PortalRoutinePage() {
  const { data, isLoading } = useQuery({ queryKey: ['portal', 'routine'], queryFn: () => get<any>('/portal/routine') });
  const today = new Date().getDay();
  const [day, setDay] = useState<number | null>(null);
  const [done, setDone] = useState<Record<string, boolean>>({});
  if (isLoading) return <Skeleton className="h-96" />;
  if (!data) return <div className="animate-slide-up"><PageHeader title="Mi rutina" /><Card><EmptyState icon={<Dumbbell />} title="Todavía no tienes una rutina asignada" description="Tu entrenador puede crearla desde el panel. Mientras tanto, pregunta en recepción." /></Card></div>;
  const days: any[] = data.days;
  const active = day ?? (days.some((d) => d.dayOfWeek === today) ? today : days[0]?.dayOfWeek);
  const current = days.find((d) => d.dayOfWeek === active);

  return (
    <div className="animate-slide-up">
      <PageHeader title={data.name} description={data.description ?? undefined} actions={<div className="flex gap-2"><Badge tone="brand">{ROUTINE_GOAL[data.goal]?.label ?? 'General'}</Badge><StatusBadge value={data.level} map={DIFFICULTY} />{data.weeks && <Badge>{data.weeks} semanas</Badge>}</div>} />
      <p className="mb-4 text-[12.5px] text-ink-3">Asignada por {data.trainer ? `${data.trainer.firstName} ${data.trainer.lastName}` : 'tu entrenador'}{data.startDate ? ` · desde ${fmtDate(data.startDate)}` : ''}</p>
      <div className="mb-4 flex gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
        {days.map((d) => <button key={d.id} onClick={() => setDay(d.dayOfWeek)} className={cn('shrink-0 rounded-xl px-3.5 py-2 text-left transition-colors', active === d.dayOfWeek ? 'bg-side text-side-ink dark:bg-brand dark:text-[#14161C]' : 'bg-surface border border-line text-ink-2')}><span className="block text-[12.5px] font-semibold">{DAYS_SHORT_ES[d.dayOfWeek]}</span><span className="block text-[11px] opacity-80">{d.title ?? `${d.exercises.length} ejercicios`}</span></button>)}
      </div>
      {current && (
        <Card>
          <div className="border-b border-line px-5 py-4"><p className="font-display text-[16px] font-semibold">{DAYS_ES[current.dayOfWeek]} · {current.title ?? 'Sesión'}</p><p className="text-[12.5px] text-ink-2">{current.exercises.length} ejercicios · marca los que completes</p></div>
          <ul className="divide-y divide-line">
            {current.exercises.map((x: any, i: number) => (
              <li key={x.id} className={cn('flex items-start gap-3 px-5 py-3.5 transition-opacity', done[x.id] && 'opacity-50')}>
                <button onClick={() => setDone((d) => ({ ...d, [x.id]: !d[x.id] }))} className={cn('mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 text-[11px] font-bold transition-colors', done[x.id] ? 'border-brand bg-brand text-[#14161C]' : 'border-line-strong text-ink-3')}>{done[x.id] ? '✓' : i + 1}</button>
                <div className="min-w-0 flex-1"><p className="font-semibold">{x.exercise.name}</p><p className="text-[12.5px] text-ink-2">{x.exercise.category?.name}{x.exercise.equipment ? ` · ${x.exercise.equipment}` : ''}</p>{x.notes && <p className="mt-0.5 text-[12px] text-ink-3">{x.notes}</p>}</div>
                <div className="text-right text-[13px]"><p className="font-display font-bold">{x.sets} × {x.reps}</p>{x.weight && <p className="text-[12px] text-ink-2">{x.weight}</p>}{x.restSeconds && <p className="inline-flex items-center gap-1 text-[11.5px] text-ink-3"><Timer className="h-3 w-3" />{x.restSeconds}s</p>}</div>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
