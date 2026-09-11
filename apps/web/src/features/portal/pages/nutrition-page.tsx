import { useQuery } from '@tanstack/react-query';
import { Apple, Flame } from 'lucide-react';
import { get } from '@/lib/api';
import { DAYS_ES } from '@/lib/format';
import { MEAL_TYPE } from '@/lib/labels';
import { Card, CardBody, CardHeader, EmptyState, PageHeader, Skeleton } from '@/components/ui';

export default function PortalNutritionPage() {
  const { data, isLoading } = useQuery({ queryKey: ['portal', 'nutrition'], queryFn: () => get<any[]>('/portal/nutrition') });
  const days = (data ?? []).filter((d) => d.meals.length);
  const today = new Date().getDay();
  return (
    <div className="animate-slide-up">
      <PageHeader title="Plan de nutrición" description="Comidas sugeridas por tu nutricionista para cada día de la semana." />
      {isLoading ? <Skeleton className="h-64" /> : days.length === 0 ? <Card><EmptyState icon={<Apple />} title="Aún no tienes un plan nutricional" description="Pide una cita con nutrición en recepción para crear el tuyo." /></Card> : (
        <div className="grid gap-4 sm:grid-cols-2">
          {[...days].sort((a, b) => ((a.dayOfWeek - today + 7) % 7) - ((b.dayOfWeek - today + 7) % 7)).map((d) => (
            <Card key={d.dayOfWeek} className={d.dayOfWeek === today ? 'ring-2 ring-brand' : ''}>
              <CardHeader title={<>{DAYS_ES[d.dayOfWeek]}{d.dayOfWeek === today && <span className="ml-2 rounded-md bg-brand px-1.5 text-[10px] text-[#14161C]">hoy</span>}</>} description={<span className="inline-flex items-center gap-1"><Flame className="h-3.5 w-3.5 text-warning" />{d.calories} kcal</span>} />
              <CardBody className="pt-0 space-y-2">
                {d.meals.map((m: any) => <div key={m.id} className="rounded-xl bg-surface-2/70 p-3"><p className="text-[11px] font-semibold uppercase tracking-wider text-brand-ink">{MEAL_TYPE[m.mealType]}</p><p className="mt-0.5 text-[13.5px]">{m.description}</p><p className="mt-1 text-[11.5px] text-ink-3">{m.calories ?? 0} kcal · P {m.protein ?? 0} g · C {m.carbs ?? 0} g · G {m.fats ?? 0} g</p></div>)}
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
