import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, CreditCard, Pencil, Plus, Sparkles, Trash2, Users } from 'lucide-react';
import { toast } from 'sonner';
import { del, get, patch, post } from '@/lib/api';
import { fmtMoney } from '@/lib/format';
import type { MembershipPlan } from '@/types';
import { Badge, Button, ConfirmDialog, Dialog, PageHeader, Skeleton, Tooltip } from '@/components/ui';
import { AutoForm, type FieldConfig } from '@/components/auto-form';

const fields: FieldConfig[] = [
  { name: 'name', label: 'Nombre del plan', required: true, placeholder: 'Miembro Oro' },
  { name: 'color', label: 'Color', type: 'color' },
  { name: 'durationDays', label: 'Duración (días)', type: 'number', required: true, min: 1 },
  { name: 'price', label: 'Precio', type: 'number', required: true, step: 0.01 },
  { name: 'registrationFee', label: 'Tarifa de inscripción', type: 'number', step: 0.01 },
  { name: 'installments', label: 'Plan de cuotas (n.º)', type: 'number', min: 1 },
  { name: 'description', label: 'Descripción', type: 'textarea' },
  { name: 'benefitsText', label: 'Beneficios (uno por línea)', type: 'textarea', hint: 'Cada línea se muestra como un beneficio del plan.' },
  { name: 'activityIds', label: 'Actividades incluidas', type: 'multiselect' },
  { name: 'stripePriceId', label: 'ID de precio en Stripe', placeholder: 'price_…' },
  { name: 'isActive', label: 'Plan activo', type: 'switch' },
];

export default function MembershipsPage() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<MembershipPlan | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<MembershipPlan | null>(null);
  const { data, isLoading } = useQuery({ queryKey: ['/memberships', 'grid'], queryFn: () => get<MembershipPlan[]>('/memberships', { limit: 100 }) });
  const { data: activities } = useQuery({ queryKey: ['activities', 'all'], queryFn: () => get<any[]>('/activities', { limit: 200 }) });
  const activityOptions = (activities ?? []).map((a) => ({ value: a.id, label: a.name, hint: a.category }));
  const invalidate = () => { qc.invalidateQueries({ queryKey: ['/memberships'] }); qc.invalidateQueries({ queryKey: ['options', 'plans'] }); };

  const save = useMutation({
    mutationFn: (v: any) => {
      const payload = { ...v, benefits: (v.benefitsText ?? '').split('\n').map((s: string) => s.trim()).filter(Boolean), benefitsText: undefined };
      return editing ? patch(`/memberships/${editing.id}`, payload) : post('/memberships', payload);
    },
    onSuccess: () => { toast.success(editing ? 'Plan actualizado' : 'Plan creado'); setEditing(null); setCreating(false); invalidate(); },
    onError: (e: Error) => toast.error(e.message),
  });
  const remove = useMutation({ mutationFn: (p: MembershipPlan) => del(`/memberships/${p.id}`), onSuccess: () => { toast.success('Plan eliminado'); setDeleting(null); invalidate(); }, onError: (e: Error) => toast.error(e.message) });
  const toggleStripe = useMutation({ mutationFn: (p: MembershipPlan) => patch(`/memberships/${p.id}`, { stripePriceId: p.stripePriceId ? '' : `price_${p.id.slice(-8)}` }), onSuccess: () => { toast.success('Stripe actualizado'); invalidate(); } });

  const fieldsWithOptions = fields.map((f) => (f.name === 'activityIds' ? { ...f, options: activityOptions } : f));

  return (
    <div className="animate-slide-up">
      <PageHeader eyebrow="Membresías" title="Tipos de membresía" description="Planes disponibles, precios, duración y actividades incluidas." actions={<Button onClick={() => setCreating(true)}><Plus className="h-4 w-4" />Nueva afiliación</Button>} />
      {isLoading ? <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-80 rounded-2xl" />)}</div> : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {data?.map((p) => (
            <div key={p.id} className="card flex flex-col overflow-hidden transition-shadow hover:shadow-pop">
              <div className="h-2" style={{ background: p.color }} />
              <div className="flex-1 p-5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-display text-[17px] font-semibold">{p.name}</h3>
                    <p className="text-[12.5px] text-ink-2">{p.durationDays} días · {p.installments > 1 ? `${p.installments} cuotas` : 'pago único'}</p>
                  </div>
                  {!p.isActive && <Badge>Inactivo</Badge>}
                </div>
                <p className="kpi-number mt-4 text-[32px]">{fmtMoney(p.price)}<span className="ml-1 text-[13px] font-medium text-ink-3">/ plan</span></p>
                <p className="text-[12px] text-ink-3">Inscripción {fmtMoney(p.registrationFee)} · {fmtMoney(p.price / Math.max(1, Math.round(p.durationDays / 30)))} al mes aprox.</p>
                {p.description && <p className="mt-3 text-[13px] text-ink-2">{p.description}</p>}
                <ul className="mt-4 space-y-1.5">
                  {p.benefits.map((b) => <li key={b} className="flex items-start gap-2 text-[13px]"><Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-ink" />{b}</li>)}
                </ul>
                {!!p.activities.length && (
                  <div className="mt-4">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-3">Actividades ({p.activities.length})</p>
                    <div className="mt-1.5 flex flex-wrap gap-1">{p.activities.slice(0, 6).map((a) => <Badge key={a.id}>{a.name}</Badge>)}{p.activities.length > 6 && <Badge>+{p.activities.length - 6}</Badge>}</div>
                  </div>
                )}
              </div>
              <div className="border-t border-line bg-surface-2/60 px-5 py-3">
                <div className="flex items-center justify-between text-[12.5px] text-ink-2">
                  <span className="inline-flex items-center gap-1.5"><Users className="h-3.5 w-3.5" />{p.membersCount} miembros</span>
                  <span className={p.stripePriceId ? 'text-success-ink font-medium' : ''}>{p.stripePriceId ? 'Stripe activo' : 'Sin Stripe'}</span>
                </div>
                <div className="mt-3 flex gap-2">
                  <Button size="sm" variant="outline" className="flex-1" onClick={() => setEditing(p)}><Pencil className="h-3.5 w-3.5" />Editar</Button>
                  <Tooltip content={p.stripePriceId ? 'Desactivar en Stripe' : 'Activar en Stripe'}><Button size="sm" variant={p.stripePriceId ? 'secondary' : 'dark'} onClick={() => toggleStripe.mutate(p)}><CreditCard className="h-3.5 w-3.5" /></Button></Tooltip>
                  <Button size="sm" variant="ghost" className="text-danger-ink" onClick={() => setDeleting(p)}><Trash2 className="h-3.5 w-3.5" /></Button>
                </div>
              </div>
            </div>
          ))}
          {data?.length === 0 && <div className="col-span-full card p-12 text-center text-ink-3"><Sparkles className="mx-auto mb-3 h-8 w-8" />Aún no hay planes. Crea el primero.</div>}
        </div>
      )}

      <Dialog open={creating || !!editing} onOpenChange={(o) => { if (!o) { setCreating(false); setEditing(null); } }} title={editing ? 'Editar plan' : 'Nueva afiliación'} size="lg"
        footer={<><Button variant="ghost" onClick={() => { setCreating(false); setEditing(null); }}>Cancelar</Button><Button type="submit" form="plan-form" loading={save.isPending}>{editing ? 'Guardar' : 'Crear plan'}</Button></>}>
        <AutoForm id="plan-form" fields={fieldsWithOptions} defaultValues={editing ? { ...editing, benefitsText: editing.benefits.join('\n'), activityIds: editing.activities.map((a) => a.id) } : { color: '#C3F13D', installments: 1, registrationFee: 5, isActive: true }} onSubmit={(v) => save.mutate(v)} />
      </Dialog>
      <ConfirmDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)} title="Eliminar plan" description={`Se eliminará el plan “${deleting?.name}”. Los miembros asociados quedarán sin plan.`} onConfirm={() => deleting && remove.mutate(deleting)} loading={remove.isPending} />
    </div>
  );
}
