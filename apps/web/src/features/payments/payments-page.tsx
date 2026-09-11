import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2, Clock, Copy, CreditCard, FileText, Link2, Receipt, TrendingUp, Wallet } from 'lucide-react';
import { toast } from 'sonner';
import { download, get, patch, post } from '@/lib/api';
import { AutoForm } from '@/components/auto-form';
import { fmtDate, fmtMoney } from '@/lib/format';
import { PAYMENT_METHOD, PAYMENT_STATUS, toOptions } from '@/lib/labels';
import type { Payment } from '@/types';
import { CrudPage } from '@/components/crud-page';
import type { Column } from '@/components/data-table';
import type { FieldConfig } from '@/components/auto-form';
import { Avatar, Badge, Button, Card, CardBody, CardHeader, Dialog, Input, Select, StatCard, StatusBadge } from '@/components/ui';
import { Donut, Legend } from '@/components/charts';
import { CHART_COLORS } from '@/lib/labels';

const fields: FieldConfig[] = [
  { name: 'memberId', label: 'Miembro', type: 'select', source: 'members', required: true, colSpan: 2 },
  { name: 'concept', label: 'Concepto', required: true, colSpan: 2, placeholder: 'Membresía Oro · Octubre' },
  { name: 'amount', label: 'Monto', type: 'number', required: true, step: 0.01 },
  { name: 'method', label: 'Método de pago', type: 'select', options: toOptions(PAYMENT_METHOD), required: true },
  { name: 'status', label: 'Estado', type: 'select', options: toOptions(PAYMENT_STATUS), required: true },
  { name: 'paidAt', label: 'Fecha de pago', type: 'date' },
  { name: 'dueDate', label: 'Fecha límite (si está pendiente)', type: 'date' },
  { name: 'reference', label: 'Referencia / n.º de transacción' },
  { name: 'notes', label: 'Notas', type: 'textarea' },
];

const columns: Column<Payment>[] = [
  { key: 'invoiceNumber', header: 'Factura', sortable: true, render: (p) => <span className="font-mono text-[12.5px] font-medium">{p.invoiceNumber}</span> },
  { key: 'member', header: 'Miembro', render: (p) => p.member ? <div className="flex items-center gap-2.5"><Avatar name={`${p.member.firstName} ${p.member.lastName}`} src={p.member.photoUrl} size="sm" /><Link to={`/miembros/${p.memberId}`} className="font-medium hover:underline">{p.member.firstName} {p.member.lastName}</Link></div> : '—' },
  { key: 'concept', header: 'Concepto', render: (p) => <div><p>{p.concept}</p>{p.reference && <p className="text-[11.5px] text-ink-3">Ref. {p.reference}</p>}</div> },
  { key: 'paidAt', header: 'Fecha', sortable: true, render: (p) => <div><p>{fmtDate(p.paidAt)}</p>{p.status === 'PENDING' && p.dueDate && <p className="text-[11.5px] text-warning-ink">vence {fmtDate(p.dueDate)}</p>}</div> },
  { key: 'method', header: 'Método', sortable: true, render: (p) => <Badge>{PAYMENT_METHOD[p.method]}</Badge> },
  { key: 'amount', header: 'Monto', sortable: true, render: (p) => <b className="tabular-nums">{fmtMoney(p.amount)}</b> },
  { key: 'status', header: 'Estado', sortable: true, render: (p) => <StatusBadge value={p.status} map={PAYMENT_STATUS} /> },
];

export default function PaymentsPage() {
  const qc = useQueryClient();
  const [params] = useSearchParams();
  const { data: s } = useQuery({ queryKey: ['payments', 'stats'], queryFn: () => get<any>('/payments/stats') });
  const [online, setOnline] = useState(false);
  const [link, setLink] = useState<string | null>(null);
  const checkout = useMutation({ mutationFn: (v: any) => post<{ url: string; provider: string }>('/payments/checkout', v), onSuccess: (r) => { setLink(r.url); qc.invalidateQueries({ queryKey: ['/payments'] }); }, onError: (e: Error) => toast.error(e.message) });
  const markPaid = useMutation({ mutationFn: (p: Payment) => patch(`/payments/${p.id}`, { status: 'PAID', paidAt: new Date().toISOString() }), onSuccess: () => { toast.success('Pago marcado como pagado'); qc.invalidateQueries({ queryKey: ['/payments'] }); qc.invalidateQueries({ queryKey: ['payments', 'stats'] }); } });
  const byMethod = (s?.byMethod ?? []).map((m: any, i: number) => ({ name: PAYMENT_METHOD[m.method] ?? m.method, value: Math.round(m.total), color: CHART_COLORS[i] }));

  return (
    <CrudPage<Payment>
      eyebrow="Operación"
      title="Pagos"
      description="Cobros de membresías y servicios, facturación y pendientes por cobrar."
      resource="/payments"
      entityName="pago"
      createLabel="Registrar pago"
      columns={columns}
      fields={fields}
      filters={params.get('status') ? { status: params.get('status') } : {}}
      emptyIcon={<CreditCard />}
      searchPlaceholder="Buscar por factura, miembro, concepto o referencia…"
      rowActions={[
        { label: 'Factura PDF', icon: <FileText />, onClick: (p) => download(`/payments/${p.id}/invoice.pdf`, `${p.invoiceNumber}.pdf`, true) },
        { label: 'Marcar como pagado', icon: <CheckCircle2 />, onClick: (p) => markPaid.mutate(p), hidden: (p) => p.status === 'PAID' },
      ]}
      headerActions={<Button variant="outline" onClick={() => { setLink(null); setOnline(true); }}><Link2 className="h-4 w-4" />Cobro en línea</Button>}
      headerExtra={
        <Dialog open={online} onOpenChange={setOnline} title="Generar enlace de pago" description={`Pasarela activa: ${s?.onlineProvider === 'STRIPE' ? 'Stripe' : 'demostración (sin clave de Stripe)'}. El enlace se envía al miembro para que pague desde su teléfono.`} size="sm" footer={<><Button variant="ghost" onClick={() => setOnline(false)}>Cerrar</Button>{!link && <Button type="submit" form="checkout-form" loading={checkout.isPending}>Generar enlace</Button>}</>}>
          {link ? (
            <div className="space-y-3"><p className="text-[13px] text-ink-2">Enlace listo. Cópialo y compártelo por WhatsApp o correo.</p><div className="flex gap-2"><Input readOnly value={link} className="font-mono text-[12px]" /><Button variant="secondary" onClick={() => { navigator.clipboard.writeText(link); toast.success('Enlace copiado'); }}><Copy className="h-4 w-4" /></Button></div></div>
          ) : (
            <AutoForm id="checkout-form" fields={[{ name: 'memberId', label: 'Miembro', type: 'select', source: 'members', required: true }, { name: 'planId', label: 'Plan a pagar', type: 'select', source: 'plans', required: true }]} onSubmit={(v) => checkout.mutate(v)} columns={1} />
          )}
        </Dialog>
      }
      above={
        <div className="mb-6 grid gap-4 lg:grid-cols-[repeat(4,1fr)_1.3fr]">
          <StatCard label="Ingresos del mes" value={fmtMoney(s?.monthTotal)} hint={`vs ${fmtMoney(s?.prevMonthTotal)} anterior`} trend={s?.growth ?? undefined} icon={<Wallet />} tone="success" />
          <StatCard label="Cobros de hoy" value={fmtMoney(s?.todayTotal)} icon={<TrendingUp />} tone="brand" />
          <StatCard label="Pendiente" value={fmtMoney(s?.pendingTotal)} hint={`${s?.pendingCount ?? 0} facturas`} icon={<Clock />} tone="warning" />
          <StatCard label="Transacciones" value={s?.monthCount ?? '…'} hint="este mes" icon={<Receipt />} tone="info" />
          <Card className="lg:row-span-1"><CardHeader title="Por método" className="pb-0" /><CardBody className="grid grid-cols-[110px_1fr] items-center gap-2 pt-1">{byMethod.length ? <><Donut data={byMethod} height={110} formatter={(v) => fmtMoney(v)} centerLabel="mes" centerValue={<span className="text-[14px]">{byMethod.length}</span>} /><Legend items={byMethod.map((m: any) => ({ ...m, value: fmtMoney(m.value) }))} /></> : <p className="col-span-2 text-[12.5px] text-ink-3">Sin pagos este mes.</p>}</CardBody></Card>
        </div>
      }
      toolbar={(c) => (
        <>
          <Select value={(c.filters.status as string) ?? ''} onChange={(e) => c.setFilter('status', e.target.value)} className="w-36"><option value="">Todo estado</option>{toOptions(PAYMENT_STATUS).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</Select>
          <Select value={(c.filters.method as string) ?? ''} onChange={(e) => c.setFilter('method', e.target.value)} className="w-36"><option value="">Todo método</option>{toOptions(PAYMENT_METHOD).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</Select>
          <Input type="date" value={(c.filters.from as string) ?? ''} onChange={(e) => c.setFilter('from', e.target.value)} className="w-36" />
          <Input type="date" value={(c.filters.to as string) ?? ''} onChange={(e) => c.setFilter('to', e.target.value)} className="w-36" />
        </>
      )}
    />
  );
}
