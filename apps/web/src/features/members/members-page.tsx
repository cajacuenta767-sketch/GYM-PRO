import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Users, UserCheck, UserX, Clock, UserPlus } from 'lucide-react';
import { get } from '@/lib/api';
import { fmtDate, daysUntil } from '@/lib/format';
import { MEMBER_STATUS, toOptions } from '@/lib/labels';
import type { Member } from '@/types';
import { CrudPage } from '@/components/crud-page';
import type { Column } from '@/components/data-table';
import { Avatar, Badge, ColorDot, Select, StatCard, StatusBadge } from '@/components/ui';
import { useOptions } from '@/hooks/use-options';
import { memberFields, memberToForm } from './fields';

export default function MembersPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { data: stats } = useQuery({ queryKey: ['members', 'stats'], queryFn: () => get<any>('/members/stats') });
  const { data: plans } = useOptions('plans');

  const columns: Column<Member>[] = [
    { key: 'firstName', header: 'Miembro', sortable: true, render: (m) => (
      <div className="flex items-center gap-3">
        <Avatar name={`${m.firstName} ${m.lastName}`} src={m.photoUrl} />
        <div className="min-w-0"><p className="truncate font-medium text-ink">{m.firstName} {m.lastName}</p><p className="truncate text-[12px] text-ink-3">{m.code} · {m.email ?? 'sin correo'}</p></div>
      </div>
    ) },
    { key: 'plan', header: 'Membresía', render: (m) => m.plan ? <span className="inline-flex items-center gap-2"><ColorDot color={m.plan.color} />{m.plan.name}</span> : <span className="text-ink-3">Sin plan</span> },
    { key: 'status', header: 'Estado', sortable: true, render: (m) => <StatusBadge value={m.status} map={MEMBER_STATUS} /> },
    { key: 'expiresAt', header: 'Caducidad', sortable: true, render: (m) => {
      const d = daysUntil(m.expiresAt);
      return <div><p>{fmtDate(m.expiresAt)}</p>{d !== null && m.status === 'ACTIVE' && d <= 7 && <Badge tone={d <= 0 ? 'danger' : 'warning'} className="mt-0.5">{d <= 0 ? 'Vencida' : `${d} días`}</Badge>}</div>;
    } },
    { key: 'trainer', header: 'Entrenador', render: (m) => m.trainer ? `${m.trainer.firstName} ${m.trainer.lastName}` : <span className="text-ink-3">—</span> },
    { key: 'phone', header: 'Teléfono', render: (m) => m.phone ?? '—' },
    { key: 'joinDate', header: 'Ingreso', sortable: true, render: (m) => fmtDate(m.joinDate) },
  ];

  return (
    <CrudPage<Member>
      eyebrow="Gestión de miembros"
      title="Miembros"
      description="Registro completo de los miembros del gimnasio, su afiliación y estado."
      resource="/members"
      entityName="miembro"
      columns={columns}
      fields={memberFields}
      toForm={memberToForm}
      dialogSize="lg"
      searchPlaceholder="Buscar por nombre, código, correo o teléfono…"
      initialCreate={params.get('nuevo') === '1'}
      onView={(m) => navigate(`/miembros/${m.id}`)}
      onRowClick={(m) => navigate(`/miembros/${m.id}`)}
      emptyIcon={<Users />}
      above={
        <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-5">
          <StatCard label="Total" value={stats?.total ?? '…'} icon={<Users />} tone="neutral" />
          <StatCard label="Activos" value={stats?.active ?? '…'} icon={<UserCheck />} tone="success" />
          <StatCard label="Vencidos" value={stats?.expired ?? '…'} icon={<UserX />} tone="danger" />
          <StatCard label="Vencen en 7 días" value={stats?.expiringSoon ?? '…'} icon={<Clock />} tone="warning" />
          <StatCard label="Nuevos este mes" value={stats?.newThisMonth ?? '…'} icon={<UserPlus />} tone="brand" className="col-span-2 lg:col-span-1" />
        </div>
      }
      toolbar={(c) => (
        <>
          <Select value={(c.filters.status as string) ?? ''} onChange={(e) => c.setFilter('status', e.target.value)} className="w-40">
            <option value="">Todos los estados</option>
            {toOptions(MEMBER_STATUS).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </Select>
          <Select value={(c.filters.planId as string) ?? ''} onChange={(e) => c.setFilter('planId', e.target.value)} className="w-44">
            <option value="">Todas las membresías</option>
            {(plans ?? []).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </Select>
        </>
      )}
    />
  );
}
