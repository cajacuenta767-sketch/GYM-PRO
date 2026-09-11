import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ClipboardList, Copy, GripVertical, Plus, Search, Trash2, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import { del, get, list, patch, post } from '@/lib/api';
import { cn } from '@/lib/utils';
import { DAYS_ES, DAYS_SHORT_ES, fmtDate } from '@/lib/format';
import { DIFFICULTY, ROUTINE_GOAL, toOptions } from '@/lib/labels';
import { useDebounce } from '@/hooks/use-debounce';
import { useList } from '@/hooks/use-list';
import { useOptions } from '@/hooks/use-options';
import { Avatar, Badge, Button, ConfirmDialog, Dialog, Drawer, Input, Label, PageHeader, Select, StatusBadge, Textarea } from '@/components/ui';
import { DataTable, type Column } from '@/components/data-table';
import { AutoForm } from '@/components/auto-form';

interface RxItem { key: string; exerciseId: string; name: string; category?: string; sets: number; reps: string; restSeconds?: number | null; weight?: string; notes?: string }
interface DayItem { key: string; dayOfWeek: number; title: string; exercises: RxItem[] }
interface Routine { id: string; name: string; description?: string | null; goal?: string | null; level: string; weeks?: number | null; isTemplate: boolean; memberId?: string | null; trainerId?: string | null; startDate?: string | null; updatedAt: string; member?: any; trainer?: any; days: any[] }

const uid = () => Math.random().toString(36).slice(2, 9);
const LEVELS = toOptions(DIFFICULTY);

export default function RoutinesPage() {
  const qc = useQueryClient();
  const ctrl = useList<Routine>('/routines', { limit: 10 });
  const [editing, setEditing] = useState<Routine | 'new' | null>(null);
  const [assigning, setAssigning] = useState<Routine | null>(null);
  const [deleting, setDeleting] = useState<Routine | null>(null);
  const invalidate = () => qc.invalidateQueries({ queryKey: ['/routines'] });
  const remove = useMutation({ mutationFn: (r: Routine) => del(`/routines/${r.id}`), onSuccess: () => { toast.success('Rutina eliminada'); setDeleting(null); invalidate(); } });
  const assign = useMutation({ mutationFn: (v: any) => post(`/routines/${assigning!.id}/assign`, v), onSuccess: () => { toast.success('Rutina asignada'); setAssigning(null); invalidate(); }, onError: (e: Error) => toast.error(e.message) });

  const columns: Column<Routine>[] = [
    { key: 'name', header: 'Rutina', sortable: true, render: (r) => <div><p className="font-medium">{r.name}</p><p className="text-[12px] text-ink-3">{r.days.length} días · {r.days.reduce((a, d) => a + d.exercises.length, 0)} ejercicios{r.weeks ? ` · ${r.weeks} semanas` : ''}</p></div> },
    { key: 'goal', header: 'Objetivo', render: (r) => <StatusBadge value={r.goal ?? 'GENERAL'} map={ROUTINE_GOAL} /> },
    { key: 'level', header: 'Nivel', sortable: true, render: (r) => <StatusBadge value={r.level} map={DIFFICULTY} /> },
    { key: 'member', header: 'Asignada a', render: (r) => r.isTemplate ? <Badge tone="brand">Plantilla</Badge> : r.member ? <span className="inline-flex items-center gap-2"><Avatar name={`${r.member.firstName} ${r.member.lastName}`} src={r.member.photoUrl} size="xs" /><Link to={`/miembros/${r.member.id}`} className="hover:underline">{r.member.firstName} {r.member.lastName}</Link></span> : '—' },
    { key: 'trainer', header: 'Entrenador', render: (r) => r.trainer ? `${r.trainer.firstName} ${r.trainer.lastName}` : '—' },
    { key: 'updatedAt', header: 'Actualizada', sortable: true, render: (r) => fmtDate(r.updatedAt) },
  ];

  return (
    <div className="animate-slide-up">
      <PageHeader eyebrow="Entrenamiento" title="Rutinas de entrenamiento" description="Plantillas reutilizables y rutinas asignadas a cada miembro, organizadas por día y ejercicio." actions={<Button onClick={() => setEditing('new')}><Plus className="h-4 w-4" />Nueva rutina</Button>} />
      <DataTable controller={ctrl} columns={columns} searchPlaceholder="Buscar rutina o miembro…" emptyIcon={<ClipboardList />} onEdit={(r) => setEditing(r)} onDelete={(r) => setDeleting(r)}
        actions={[{ label: 'Asignar a un miembro', icon: <UserPlus />, onClick: (r) => setAssigning(r) }, { label: 'Duplicar como plantilla', icon: <Copy />, onClick: async (r) => { const full = await get<Routine>(`/routines/${r.id}`); await post('/routines', { name: `${full.name} (copia)`, description: full.description, goal: full.goal, level: full.level, weeks: full.weeks, isTemplate: true, trainerId: full.trainerId, days: full.days.map((d: any) => ({ dayOfWeek: d.dayOfWeek, title: d.title, exercises: d.exercises.map((e: any) => ({ exerciseId: e.exerciseId, sets: e.sets, reps: e.reps, restSeconds: e.restSeconds, weight: e.weight, notes: e.notes })) })) }); toast.success('Plantilla duplicada'); invalidate(); } }]}
        toolbar={<Select value={(ctrl.filters.isTemplate as string) ?? ''} onChange={(e) => ctrl.setFilter('isTemplate', e.target.value)} className="w-44"><option value="">Plantillas y asignadas</option><option value="true">Solo plantillas</option><option value="false">Solo asignadas</option></Select>} />

      {editing && <RoutineBuilder routine={editing === 'new' ? null : editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); invalidate(); }} />}

      <Dialog open={!!assigning} onOpenChange={(o) => !o && setAssigning(null)} title={`Asignar “${assigning?.name}”`} description="Se crea una copia de la rutina para el miembro elegido." size="sm" footer={<><Button variant="ghost" onClick={() => setAssigning(null)}>Cancelar</Button><Button type="submit" form="assign-form" loading={assign.isPending}>Asignar</Button></>}>
        <AutoForm id="assign-form" fields={[{ name: 'memberId', label: 'Miembro', type: 'select', source: 'members', required: true }, { name: 'startDate', label: 'Fecha de inicio', type: 'date' }]} onSubmit={(v) => assign.mutate(v)} columns={1} />
      </Dialog>
      <ConfirmDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)} title="Eliminar rutina" description={`Se eliminará “${deleting?.name}”.`} onConfirm={() => deleting && remove.mutate(deleting)} loading={remove.isPending} />
    </div>
  );
}

/** Constructor de rutinas: datos generales + días + ejercicios con series y repeticiones. */
function RoutineBuilder({ routine, onClose, onSaved }: { routine: Routine | null; onClose: () => void; onSaved: () => void }) {
  const { data: full } = useQuery({ queryKey: ['/routines', routine?.id], queryFn: () => get<Routine>(`/routines/${routine!.id}`), enabled: !!routine });
  const { data: trainers } = useOptions('trainers');
  const { data: members } = useOptions('members');
  const [meta, setMeta] = useState({ name: routine?.name ?? '', description: routine?.description ?? '', goal: routine?.goal ?? 'GENERAL', level: routine?.level ?? 'INTERMEDIATE', weeks: routine?.weeks ?? 4, isTemplate: routine ? routine.isTemplate : true, trainerId: routine?.trainerId ?? '', memberId: routine?.memberId ?? '' });
  const [days, setDays] = useState<DayItem[] | null>(routine ? null : [{ key: uid(), dayOfWeek: 1, title: 'Día 1', exercises: [] }]);
  const [activeDay, setActiveDay] = useState(0);
  const [search, setSearch] = useState('');
  const term = useDebounce(search, 250);
  const { data: results } = useQuery({ queryKey: ['exercises', 'search', term], queryFn: () => list<any>('/exercises', { search: term, limit: 12 }).then((r) => r.data) });

  // Carga de la rutina existente en el estado del constructor
  useMemo(() => {
    if (full && days === null) {
      setDays(full.days.map((d: any) => ({ key: uid(), dayOfWeek: d.dayOfWeek, title: d.title ?? '', exercises: d.exercises.map((e: any) => ({ key: uid(), exerciseId: e.exerciseId, name: e.exercise.name, category: e.exercise.category?.name, sets: e.sets, reps: e.reps, restSeconds: e.restSeconds, weight: e.weight ?? '', notes: e.notes ?? '' })) })));
    }
  }, [full, days]);

  const save = useMutation({
    mutationFn: () => {
      const payload = { ...meta, weeks: meta.weeks ? Number(meta.weeks) : undefined, trainerId: meta.trainerId || undefined, memberId: meta.isTemplate ? undefined : meta.memberId || undefined, days: (days ?? []).map((d) => ({ dayOfWeek: d.dayOfWeek, title: d.title || undefined, exercises: d.exercises.map((e) => ({ exerciseId: e.exerciseId, sets: Number(e.sets) || 3, reps: e.reps || '12', restSeconds: e.restSeconds ? Number(e.restSeconds) : undefined, weight: e.weight || undefined, notes: e.notes || undefined })) })) };
      return routine ? patch(`/routines/${routine.id}`, payload) : post('/routines', payload);
    },
    onSuccess: () => { toast.success('Rutina guardada'); onSaved(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const list_ = days ?? [];
  const day = list_[activeDay];
  const updateDay = (patchDay: Partial<DayItem>) => setDays((ds) => (ds ?? []).map((d, i) => (i === activeDay ? { ...d, ...patchDay } : d)));
  const addExercise = (ex: any) => updateDay({ exercises: [...day.exercises, { key: uid(), exerciseId: ex.id, name: ex.name, category: ex.category?.name, sets: ex.sets ?? 3, reps: String(ex.reps ?? 12), restSeconds: ex.restSeconds ?? 60, weight: '', notes: '' }] });
  const updateEx = (key: string, patchEx: Partial<RxItem>) => updateDay({ exercises: day.exercises.map((e) => (e.key === key ? { ...e, ...patchEx } : e)) });
  const move = (key: string, dir: -1 | 1) => { const i = day.exercises.findIndex((e) => e.key === key); const j = i + dir; if (j < 0 || j >= day.exercises.length) return; const arr = [...day.exercises]; [arr[i], arr[j]] = [arr[j], arr[i]]; updateDay({ exercises: arr }); };

  return (
    <Drawer open onOpenChange={(o) => !o && onClose()} title={routine ? 'Editar rutina' : 'Nueva rutina'} width="max-w-4xl"
      footer={<><Button variant="ghost" onClick={onClose}>Cancelar</Button><Button onClick={() => save.mutate()} loading={save.isPending} disabled={!meta.name || !days}>Guardar rutina</Button></>}>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2"><Label required>Nombre</Label><Input value={meta.name} onChange={(e) => setMeta({ ...meta, name: e.target.value })} placeholder="Full body 3 días" /></div>
        <div><Label>Objetivo</Label><Select value={meta.goal} onChange={(e) => setMeta({ ...meta, goal: e.target.value })}>{toOptions(ROUTINE_GOAL).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</Select></div>
        <div><Label>Nivel</Label><Select value={meta.level} onChange={(e) => setMeta({ ...meta, level: e.target.value })}>{LEVELS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</Select></div>
        <div><Label>Semanas</Label><Input type="number" min={1} value={meta.weeks} onChange={(e) => setMeta({ ...meta, weeks: Number(e.target.value) })} /></div>
        <div><Label>Entrenador</Label><Select value={meta.trainerId} onChange={(e) => setMeta({ ...meta, trainerId: e.target.value })}><option value="">Sin asignar</option>{(trainers ?? []).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</Select></div>
        <div><Label>Tipo</Label><Select value={meta.isTemplate ? 'template' : 'member'} onChange={(e) => setMeta({ ...meta, isTemplate: e.target.value === 'template' })}><option value="template">Plantilla reutilizable</option><option value="member">Asignada a un miembro</option></Select></div>
        {!meta.isTemplate && <div><Label required>Miembro</Label><Select value={meta.memberId} onChange={(e) => setMeta({ ...meta, memberId: e.target.value })}><option value="">Selecciona…</option>{(members ?? []).map((o) => <option key={o.value} value={o.value}>{o.label} · {o.hint}</option>)}</Select></div>}
        <div className="sm:col-span-2"><Label>Descripción</Label><Textarea rows={2} className="min-h-[60px]" value={meta.description ?? ''} onChange={(e) => setMeta({ ...meta, description: e.target.value })} /></div>
      </div>

      <div className="mt-6 border-t border-line pt-5">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          {list_.map((d, i) => <button key={d.key} onClick={() => setActiveDay(i)} className={cn('rounded-xl px-3 py-1.5 text-[12.5px] font-semibold transition-colors', activeDay === i ? 'bg-side text-side-ink dark:bg-brand dark:text-[#14161C]' : 'bg-surface-2 text-ink-2 hover:text-ink')}>{DAYS_SHORT_ES[d.dayOfWeek]} · {d.title || `Día ${i + 1}`} <span className="opacity-60">({d.exercises.length})</span></button>)}
          <Button size="sm" variant="outline" onClick={() => { const used = new Set(list_.map((d) => d.dayOfWeek)); const next = [1, 2, 3, 4, 5, 6, 0].find((d) => !used.has(d)) ?? 1; setDays([...list_, { key: uid(), dayOfWeek: next, title: `Día ${list_.length + 1}`, exercises: [] }]); setActiveDay(list_.length); }}><Plus className="h-3.5 w-3.5" />Día</Button>
        </div>
        {day && (
          <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
            <div className="rounded-2xl border border-line">
              <div className="flex flex-wrap items-center gap-2 border-b border-line p-3">
                <Select value={day.dayOfWeek} onChange={(e) => updateDay({ dayOfWeek: Number(e.target.value) })} className="w-36">{[1, 2, 3, 4, 5, 6, 0].map((d) => <option key={d} value={d}>{DAYS_ES[d]}</option>)}</Select>
                <Input value={day.title} onChange={(e) => updateDay({ title: e.target.value })} placeholder="Título de la sesión (Pierna, Empuje…)" className="flex-1 min-w-[160px]" />
                <Button variant="ghost" size="icon-sm" className="text-danger-ink" onClick={() => { setDays(list_.filter((_, i) => i !== activeDay)); setActiveDay(0); }} disabled={list_.length <= 1}><Trash2 className="h-4 w-4" /></Button>
              </div>
              {day.exercises.length === 0 && <p className="p-6 text-center text-[13px] text-ink-3">Añade ejercicios desde el buscador de la derecha.</p>}
              <ul className="divide-y divide-line">
                {day.exercises.map((e, i) => (
                  <li key={e.key} className="grid grid-cols-[auto_1fr] gap-3 p-3">
                    <div className="flex flex-col items-center gap-1 pt-1 text-ink-3"><button onClick={() => move(e.key, -1)} className="hover:text-ink" aria-label="Subir">▲</button><GripVertical className="h-4 w-4" /><button onClick={() => move(e.key, 1)} className="hover:text-ink" aria-label="Bajar">▼</button></div>
                    <div>
                      <div className="flex items-start justify-between gap-2"><div><p className="text-[13.5px] font-semibold">{i + 1}. {e.name}</p><p className="text-[11.5px] text-ink-3">{e.category}</p></div><Button variant="ghost" size="icon-sm" className="text-danger-ink" onClick={() => updateDay({ exercises: day.exercises.filter((x) => x.key !== e.key) })}><Trash2 className="h-4 w-4" /></Button></div>
                      <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-5">
                        <div><Label className="mb-1 text-[11px]">Series</Label><Input type="number" min={1} value={e.sets} onChange={(ev) => updateEx(e.key, { sets: Number(ev.target.value) })} className="h-8" /></div>
                        <div><Label className="mb-1 text-[11px]">Reps</Label><Input value={e.reps} onChange={(ev) => updateEx(e.key, { reps: ev.target.value })} className="h-8" placeholder="8-10" /></div>
                        <div><Label className="mb-1 text-[11px]">Descanso (s)</Label><Input type="number" value={e.restSeconds ?? ''} onChange={(ev) => updateEx(e.key, { restSeconds: ev.target.value ? Number(ev.target.value) : null })} className="h-8" /></div>
                        <div><Label className="mb-1 text-[11px]">Carga</Label><Input value={e.weight ?? ''} onChange={(ev) => updateEx(e.key, { weight: ev.target.value })} className="h-8" placeholder="20 kg / RPE 8" /></div>
                        <div><Label className="mb-1 text-[11px]">Notas</Label><Input value={e.notes ?? ''} onChange={(ev) => updateEx(e.key, { notes: ev.target.value })} className="h-8" /></div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border border-line bg-surface-2/50 p-3">
              <p className="mb-2 text-[11.5px] font-semibold uppercase tracking-wider text-ink-3">Biblioteca de ejercicios</p>
              <div className="relative"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-3" /><Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar…" className="pl-9" /></div>
              <ul className="mt-2 max-h-[420px] space-y-1 overflow-y-auto scrollbar-thin">
                {(results ?? []).map((ex: any) => <li key={ex.id}><button onClick={() => addExercise(ex)} className="flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-[13px] hover:bg-surface"><span className="min-w-0"><span className="block truncate font-medium">{ex.name}</span><span className="block text-[11px] text-ink-3">{ex.category?.name ?? '—'} · {ex.equipment ?? 'sin equipo'}</span></span><Plus className="h-4 w-4 shrink-0 text-brand-ink" /></button></li>)}
                {results && results.length === 0 && <li className="p-3 text-[12.5px] text-ink-3">Sin resultados.</li>}
              </ul>
            </div>
          </div>
        )}
      </div>
    </Drawer>
  );
}
