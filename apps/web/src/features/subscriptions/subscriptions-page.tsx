import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { CalendarClock, History, ShieldCheck, ShieldX } from 'lucide-react';
import { get } from '@/lib/api';
import { fmtDate, fmtMoney } from '@/lib/format';
import { PAYMENT_METHOD, SUBSCRIPTION_STATUS, toOptions } from '@/lib/labels';
import type { Subscription } from '@/types';
import { CrudPage } from '@/components/crud-page';
import type { Column } from '@/components/data-table';
import type { FieldConfig } from '@/components/auto-form';
import { Avatar, ColorDot, Select, StatCard, StatusBadge } from '@/components/ui';

const fields: FieldConfig[] = [
  { name: 'memberId', label: 'Miembro', type: 'select', source: 'members', required: true },
  { name: 'planId', label: 'Plan', type: 'select', source: 'plans', required: true },
  { name: 'startDate', label: 'Inicio', type: 'date' },
  { name: 'endDate', label: 'Fin (vacío = según duración del plan)', type: 'date' },
  { name: 'price', label: 'Precio', type: 'number', step: 0.01 },
  { name: 'status', label: 'Estado', type: 'select', options: toOptions(SUBSCRIPTION_STATUS) },
  { name: 'registerPayment', label: 'Registrar pago automáticamente', type: 'switch' },
  { name: 'paymentMethod', label: 'Método de pago', type: 'select', options: toOptions(PAYMENT_METHOD) },
  { name: 'notes', label: 'Notas', type: 'textarea' },
];

const columns: Column<Subscription>[] = [
  { key: 'member', header: 'Miembro', render: (s) => s.member ? <div className="flex items-center gap-3"><Avatar name={`${s.member.firstName} ${s.member.lastName}`} src={s.member.photoUrl} size="sm" /><Link to={`/miembros/${s.memberId}`} className="font-medium hover:underline">{s.member.firstName} {s.member.lastName}</Link></div> : '—' },
  { key: 'plan', header: 'Plan', render: (s) => <span className="inline-flex items-center gap-2"><ColorDot color={s.plan?.color} />{s.plan?.name}</span> },
  { key: 'startDate', header: 'Inicio', sortable: true, render: (s) => fmtDate(s.startDate) },
  { key: 'endDate', header: 'Fin', sortable: true, render: (s) => fmtDate(s.endDate) },
  { key: 'price', header: 'Precio', sortable: true, render: (s) => <b>{fmtMoney(s.price)}</b> },
  { key: 'payments', header: 'Pagos', render: (s) => s.payments?.length ? `${s.payments.filter((p) => p.status === 'PAID').length}/${s.payments.length} pagados` : <span className="text-ink-3">—</span> },
  { key: 'status', header: 'Estado', sortable: true, render: (s) => <StatusBadge value={s.status} map={SUBSCRIPTION_STATUS} /> },
];

export default function SubscriptionsPage() {
  const { data } = useQuery({ queryKey: ['subscriptions', 'stats'], queryFn: () => get<any>('/subscriptions/stats') });
  return (
    <CrudPage<Subscription>
      eyebrow="Miembros"
      title="Historial de suscripción"
      description="Todas las suscripciones a planes, activas y pasadas, con sus pagos vinculados."
      resource="/subscriptions"
      entityName="suscripción"
      createLabel="Nueva suscripción"
      columns={columns}
      fields={fields}
      toForm={(s) => ({ ...s, registerPayment: false })}
      emptyIcon={<History />}
      searchPlaceholder="Buscar por miembro o plan…"
      above={
        <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard label="Activas" value={data?.active ?? '…'} icon={<ShieldCheck />} tone="success" />
          <StatCard label="Vencen en 15 días" value={data?.expiringSoon ?? '…'} icon={<CalendarClock />} tone="warning" />
          <StatCard label="Vencidas" value={data?.expired ?? '…'} icon={<ShieldX />} tone="danger" />
          <div className="card p-4">
            <p className="text-[12.5px] font-medium text-ink-2">Activas por plan</p>
            <ul className="mt-2 space-y-1">{(data?.byPlan ?? []).map((b: any) => <li key={b.plan} className="flex items-center justify-between text-[12.5px]"><span className="inline-flex items-center gap-1.5"><ColorDot color={b.color} />{b.plan}</span><b>{b.count}</b></li>)}</ul>
          </div>
        </div>
      }
      toolbar={(c) => (
        <Select value={(c.filters.status as string) ?? ''} onChange={(e) => c.setFilter('status', e.target.value)} className="w-40">
          <option value="">Todos los estados</option>
          {toOptions(SUBSCRIPTION_STATUS).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </Select>
      )}
    />
  );
}
