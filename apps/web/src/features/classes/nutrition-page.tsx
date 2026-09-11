import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Apple, Flame, Pencil, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { del, get, list, patch, post } from '@/lib/api';
import { DAYS_ES } from '@/lib/format';
import { MEAL_TYPE, toOptions } from '@/lib/labels';
import type { NutritionItem } from '@/types';
import { Button, Card, ConfirmDialog, Dialog, EmptyState, Label, PageHeader, Select, Skeleton } from '@/components/ui';
import { AutoForm, type FieldConfig } from '@/components/auto-form';
import { useOptions } from '@/hooks/use-options';

const fields: FieldConfig[] = [
  { name: 'dayOfWeek', label: 'Día', type: 'select', options: [1, 2, 3, 4, 5, 6, 0].map((d) => ({ value: String(d), label: DAYS_ES[d] })), required: true },
  { name: 'mealType', label: 'Comida', type: 'select', options: toOptions(MEAL_TYPE), required: true },
  { name: 'description', label: 'Descripción del plato', type: 'textarea', required: true, placeholder: 'Avena con frutos rojos y claras' },
  { name: 'calories', label: 'Calorías (kcal)', type: 'number' },
  { name: 'nutritionistId', label: 'Nutricionista', type: 'select', source: 'nutritionists' },
  { name: 'protein', label: 'Proteína (g)', type: 'number' },
  { name: 'carbs', label: 'Carbohidratos (g)', type: 'number' },
  { name: 'fats', label: 'Grasas (g)', type: 'number' },
];

export default function NutritionPage() {
  const qc = useQueryClient();
  const { data: members } = useOptions('members');
  const [memberId, setMemberId] = useState('');
  const [editing, setEditing] = useState<NutritionItem | null>(null);
  const [creating, setCreating] = useState<{ dayOfWeek: number } | null>(null);
  const [deleting, setDeleting] = useState<NutritionItem | null>(null);

  // Por defecto, el primer miembro con plan
  const { data: first } = useQuery({ queryKey: ['nutrition', 'first'], queryFn: () => list<NutritionItem>('/nutrition', { limit: 1 }) });
  useEffect(() => { if (!memberId && first?.data[0]) setMemberId(first.data[0].memberId); }, [first, memberId]);

  const { data: plan, isLoading } = useQuery({ queryKey: ['nutrition', 'weekly', memberId], queryFn: () => get<any[]>(`/nutrition/member/${memberId}/weekly`), enabled: !!memberId });
  const invalidate = () => qc.invalidateQueries({ queryKey: ['nutrition'] });

  const save = useMutation({
    mutationFn: (v: any) => (editing ? patch(`/nutrition/${editing.id}`, { ...v, dayOfWeek: Number(v.dayOfWeek) }) : post('/nutrition', { ...v, memberId, dayOfWeek: Number(v.dayOfWeek) })),
    onSuccess: () => { toast.success('Plan actualizado'); setEditing(null); setCreating(null); invalidate(); },
    onError: (e: Error) => toast.error(e.message),
  });
  const remove = useMutation({ mutationFn: (n: NutritionItem) => del(`/nutrition/${n.id}`), onSuccess: () => { setDeleting(null); invalidate(); } });

  const total = plan?.reduce((a, d) => a + d.calories, 0) ?? 0;
  const daysWith = plan?.filter((d) => d.meals.length).length ?? 0;

  return (
    <div className="animate-slide-up">
      <PageHeader eyebrow="Entrenamiento" title="Horario de nutrición" description="Plan de alimentación semanal por miembro, comida a comida." actions={<Button onClick={() => setCreating({ dayOfWeek: 1 })} disabled={!memberId}><Plus className="h-4 w-4" />Agregar comida</Button>} />
      <Card className="mb-6 p-4">
        <div className="grid gap-4 sm:grid-cols-[1fr_auto_auto] sm:items-end">
          <div>
            <Label>Miembro</Label>
            <Select value={memberId} onChange={(e) => setMemberId(e.target.value)}>
              <option value="">Selecciona un miembro…</option>
              {(members ?? []).map((m) => <option key={m.value} value={m.value}>{m.label} · {m.hint}</option>)}
            </Select>
          </div>
          <div className="rounded-xl bg-surface-2 px-4 py-2"><p className="text-[11px] font-semibold uppercase tracking-wider text-ink-3">Promedio diario</p><p className="kpi-number text-[20px] flex items-center gap-1.5"><Flame className="h-4 w-4 text-warning" />{daysWith ? Math.round(total / daysWith) : 0} kcal</p></div>
          <div className="rounded-xl bg-surface-2 px-4 py-2"><p className="text-[11px] font-semibold uppercase tracking-wider text-ink-3">Días planificados</p><p className="kpi-number text-[20px]">{daysWith} / 7</p></div>
        </div>
      </Card>

      {!memberId ? <Card><EmptyState icon={<Apple />} title="Selecciona un miembro" description="Elige un miembro para ver o crear su plan nutricional." /></Card>
        : isLoading ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 7 }).map((_, i) => <Skeleton key={i} className="h-64 rounded-2xl" />)}</div> : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[1, 2, 3, 4, 5, 6, 0].map((d) => {
            const day = plan?.find((x) => x.dayOfWeek === d);
            return (
              <Card key={d} className="flex flex-col">
                <div className="flex items-center justify-between px-4 pt-4 pb-2">
                  <div><p className="font-display text-[14.5px] font-semibold">{DAYS_ES[d]}</p><p className="text-[12px] text-ink-3">{day?.calories ?? 0} kcal</p></div>
                  <Button variant="ghost" size="icon-sm" onClick={() => setCreating({ dayOfWeek: d })}><Plus className="h-4 w-4" /></Button>
                </div>
                <div className="flex-1 space-y-2 px-4 pb-4">
                  {!day?.meals.length && <p className="rounded-xl border border-dashed border-line py-6 text-center text-[12px] text-ink-3">Sin comidas</p>}
                  {day?.meals.map((meal: NutritionItem) => (
                    <div key={meal.id} className="group rounded-xl bg-surface-2/70 p-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-ink">{MEAL_TYPE[meal.mealType]}</p>
                        <div className="flex gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                          <button onClick={() => setEditing(meal)} className="rounded p-0.5 text-ink-3 hover:text-ink"><Pencil className="h-3.5 w-3.5" /></button>
                          <button onClick={() => setDeleting(meal)} className="rounded p-0.5 text-ink-3 hover:text-danger-ink"><Trash2 className="h-3.5 w-3.5" /></button>
                        </div>
                      </div>
                      <p className="mt-0.5 text-[13px] leading-snug">{meal.description}</p>
                      <p className="mt-1 text-[11px] text-ink-3">{meal.calories ?? 0} kcal · P {meal.protein ?? 0} · C {meal.carbs ?? 0} · G {meal.fats ?? 0}</p>
                    </div>
                  ))}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={!!editing || !!creating} onOpenChange={(o) => { if (!o) { setEditing(null); setCreating(null); } }} title={editing ? 'Editar comida' : 'Agregar comida'} footer={<><Button variant="ghost" onClick={() => { setEditing(null); setCreating(null); }}>Cancelar</Button><Button type="submit" form="nut-form" loading={save.isPending}>Guardar</Button></>}>
        <AutoForm id="nut-form" fields={fields} defaultValues={editing ? { ...editing, dayOfWeek: String(editing.dayOfWeek) } : { dayOfWeek: String(creating?.dayOfWeek ?? 1), mealType: 'BREAKFAST' }} onSubmit={(v) => save.mutate(v)} />
      </Dialog>
      <ConfirmDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)} title="Eliminar comida" onConfirm={() => deleting && remove.mutate(deleting)} loading={remove.isPending} />
    </div>
  );
}
