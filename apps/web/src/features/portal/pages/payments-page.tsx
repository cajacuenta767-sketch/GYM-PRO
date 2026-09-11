import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { Check, CreditCard, Download, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { download, get, post } from '@/lib/api';
import { fmtDate, fmtMoney } from '@/lib/format';
import { PAYMENT_METHOD, PAYMENT_STATUS, SUBSCRIPTION_STATUS } from '@/lib/labels';
import { Badge, Button, Card, CardHeader, ColorDot, Dialog, EmptyState, PageHeader, Skeleton, StatusBadge } from '@/components/ui';

export default function PortalPaymentsPage() {
  const [params] = useSearchParams();
  const [renew, setRenew] = useState(false);
  const [planId, setPlanId] = useState('');
  const { data, isLoading } = useQuery({ queryKey: ['portal', 'payments'], queryFn: () => get<any>('/portal/payments') });
  const { data: plans } = useQuery({ queryKey: ['portal', 'plans'], queryFn: () => get<any[]>('/portal/plans'), enabled: renew });
  const checkout = useMutation({ mutationFn: () => post<{ url: string }>('/portal/checkout', { planId }), onSuccess: (r) => { window.location.href = r.url; }, onError: (e: Error) => toast.error(e.message) });

  return (
    <div className="animate-slide-up space-y-5">
      <PageHeader title="Pagos y membresía" description="Historial de pagos, suscripciones y renovación en línea." actions={<Button onClick={() => setRenew(true)}><CreditCard className="h-4 w-4" />Renovar membresía</Button>} />
      {params.get('cancelado') && <div className="rounded-xl border border-warning/30 bg-warning-soft p-3 text-[13px] text-warning-ink">El pago fue cancelado. Puedes intentarlo de nuevo cuando quieras.</div>}
      {isLoading ? <Skeleton className="h-64" /> : (
        <>
          <Card>
            <CardHeader title="Suscripciones" />
            {data.subscriptions.length ? <ul className="divide-y divide-line">{data.subscriptions.map((s: any) => <li key={s.id} className="flex items-center gap-3 px-5 py-3"><ColorDot color={s.plan?.color} /><div className="flex-1"><p className="font-semibold">{s.plan?.name}</p><p className="text-[12.5px] text-ink-2">{fmtDate(s.startDate)} → {fmtDate(s.endDate)}</p></div><span className="text-[13px] font-semibold">{fmtMoney(s.price)}</span><StatusBadge value={s.status} map={SUBSCRIPTION_STATUS} /></li>)}</ul> : <EmptyState title="Sin suscripciones" />}
          </Card>
          <Card>
            <CardHeader title="Pagos" description="Descarga tus facturas en PDF" />
            {data.payments.length ? <ul className="divide-y divide-line">{data.payments.map((p: any) => <li key={p.id} className="flex items-center gap-3 px-5 py-3"><div className="min-w-0 flex-1"><p className="truncate font-semibold">{p.concept}</p><p className="text-[12.5px] text-ink-2"><span className="font-mono">{p.invoiceNumber}</span> · {fmtDate(p.paidAt)} · {PAYMENT_METHOD[p.method] ?? p.method}</p></div><span className="text-[13.5px] font-bold tabular-nums">{fmtMoney(p.amount)}</span><StatusBadge value={p.status} map={PAYMENT_STATUS} /><Button variant="ghost" size="icon-sm" aria-label="Factura" onClick={() => download(`/payments/${p.id}/invoice.pdf`, `${p.invoiceNumber}.pdf`, true)}><Download className="h-4 w-4" /></Button></li>)}</ul> : <EmptyState title="Sin pagos registrados" />}
          </Card>
        </>
      )}
      <Dialog open={renew} onOpenChange={setRenew} title="Renovar membresía" description="Elige un plan y paga en línea. Tu vigencia se extiende desde la fecha actual de vencimiento." size="lg"
        footer={<><Button variant="ghost" onClick={() => setRenew(false)}>Cancelar</Button><Button onClick={() => checkout.mutate()} disabled={!planId} loading={checkout.isPending}><ShieldCheck className="h-4 w-4" />Pagar de forma segura</Button></>}>
        <div className="grid gap-3 sm:grid-cols-2">
          {(plans ?? []).map((p) => (
            <button key={p.id} onClick={() => setPlanId(p.id)} className={`rounded-2xl border-2 p-4 text-left transition-colors ${planId === p.id ? 'border-brand bg-brand-soft/40' : 'border-line hover:border-line-strong'}`}>
              <div className="flex items-center justify-between"><span className="inline-flex items-center gap-2 font-display font-semibold"><ColorDot color={p.color} />{p.name}</span>{planId === p.id && <Check className="h-4 w-4 text-brand-ink" />}</div>
              <p className="kpi-number mt-2 text-[24px]">{fmtMoney(p.price)}</p><p className="text-[12px] text-ink-3">{p.durationDays} días</p>
              <ul className="mt-2 space-y-1">{(p.benefits ?? []).slice(0, 3).map((b: string) => <li key={b} className="text-[12px] text-ink-2">· {b}</li>)}</ul>
            </button>
          ))}
        </div>
        <p className="mt-4 flex items-center gap-2 text-[12px] text-ink-3"><Badge tone="info">Demo</Badge> Sin pasarela configurada, el pago se confirma en una página de simulación.</p>
      </Dialog>
    </div>
  );
}
