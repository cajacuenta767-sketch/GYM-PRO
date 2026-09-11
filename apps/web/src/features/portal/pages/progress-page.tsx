import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { get, post } from '@/lib/api';
import { fmtDate } from '@/lib/format';
import { MEASUREMENT_TYPE } from '@/lib/labels';
import type { Measurement } from '@/types';
import { Button, Card, CardBody, CardHeader, Dialog, Input, Label, PageHeader, Select, Skeleton } from '@/components/ui';
import { AreaSeries, BarSeries } from '@/components/charts';

export default function PortalProgressPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ type: 'WEIGHT', value: '' });
  const { data: ms, isLoading } = useQuery({ queryKey: ['portal', 'measurements'], queryFn: () => get<Measurement[]>('/portal/measurements') });
  const { data: att } = useQuery({ queryKey: ['portal', 'attendance'], queryFn: () => get<any>('/portal/attendance') });
  const add = useMutation({ mutationFn: () => post('/portal/measurements', { type: form.type, value: Number(form.value) }), onSuccess: () => { toast.success('Medición guardada'); setOpen(false); setForm({ type: 'WEIGHT', value: '' }); qc.invalidateQueries({ queryKey: ['portal'] }); }, onError: (e: Error) => toast.error(e.message) });
  const series = (t: string) => (ms ?? []).filter((x) => x.type === t).map((x) => ({ label: fmtDate(x.measuredAt, 'd MMM'), value: x.value }));
  const last = (t: string) => (ms ?? []).filter((x) => x.type === t).at(-1);
  const first = (t: string) => (ms ?? []).filter((x) => x.type === t)[0];

  return (
    <div className="animate-slide-up space-y-5">
      <PageHeader title="Mi progreso" description="Tu evolución de peso, medidas y constancia." actions={<Button onClick={() => setOpen(true)}><Plus className="h-4 w-4" />Registrar medida</Button>} />
      {isLoading ? <Skeleton className="h-64" /> : (
        <div className="grid gap-4 sm:grid-cols-2">
          {(['WEIGHT', 'WAIST'] as const).map((t) => { const l = last(t), f = first(t); const diff = l && f ? Math.round((l.value - f.value) * 10) / 10 : null; return (
            <Card key={t}>
              <CardHeader title={MEASUREMENT_TYPE[t]} description={l ? `Último registro ${fmtDate(l.measuredAt)}` : 'Sin registros'} action={diff !== null && diff !== 0 ? <span className={`rounded-md px-2 py-0.5 text-[12px] font-bold ${diff < 0 ? 'bg-success-soft text-success-ink' : 'bg-warning-soft text-warning-ink'}`}>{diff > 0 ? '+' : ''}{diff} {l?.unit}</span> : undefined} />
              <CardBody className="pt-0"><p className="kpi-number text-[30px]">{l ? `${l.value} ${l.unit}` : '—'}</p>{series(t).length > 1 && <div className="-mx-2 mt-2"><AreaSeries data={series(t)} x="label" y="value" name={MEASUREMENT_TYPE[t]} height={140} /></div>}</CardBody>
            </Card>
          ); })}
        </div>
      )}
      <Card>
        <CardHeader title="Constancia" description="Visitas por semana en los últimos dos meses" />
        <CardBody>{att ? <BarSeries data={att.byWeek.map((w: any) => ({ ...w, week: fmtDate(w.week, 'd MMM') }))} x="week" series={[{ key: 'count', name: 'Visitas', color: '#7CB518' }]} height={180} /> : <Skeleton className="h-[180px]" />}</CardBody>
      </Card>
      <Dialog open={open} onOpenChange={setOpen} title="Registrar medida" size="sm" footer={<><Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button><Button onClick={() => add.mutate()} disabled={!form.value} loading={add.isPending}>Guardar</Button></>}>
        <div className="space-y-4"><div><Label>Tipo</Label><Select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>{['WEIGHT', 'WAIST', 'HIPS', 'CHEST', 'ARM'].map((t) => <option key={t} value={t}>{MEASUREMENT_TYPE[t]}</option>)}</Select></div><div><Label>Valor ({form.type === 'WEIGHT' ? 'kg' : 'cm'})</Label><Input type="number" step="0.1" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} autoFocus /></div></div>
      </Dialog>
    </div>
  );
}
