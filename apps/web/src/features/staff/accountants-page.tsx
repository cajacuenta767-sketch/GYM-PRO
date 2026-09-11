import { useQuery } from '@tanstack/react-query';
import { Calculator, Clock, TrendingUp, Wallet } from 'lucide-react';
import { get } from '@/lib/api';
import { fmtDateTime, fmtMoney } from '@/lib/format';
import { USER_ROLE, toOptions } from '@/lib/labels';
import type { AppUser } from '@/types';
import { CrudPage } from '@/components/crud-page';
import type { Column } from '@/components/data-table';
import type { FieldConfig } from '@/components/auto-form';
import { Avatar, Badge, StatCard } from '@/components/ui';

const fields: FieldConfig[] = [
  { name: 'name', label: 'Nombre completo', required: true, colSpan: 2 },
  { name: 'email', label: 'Correo', type: 'email', required: true },
  { name: 'password', label: 'Contraseña', type: 'password', hint: 'Al editar, déjala vacía para no cambiarla.' },
  { name: 'role', label: 'Tipo de cuenta', type: 'select', options: toOptions(USER_ROLE), required: true },
  { name: 'roleId', label: 'Rol de permisos', type: 'select', source: 'roles' },
  { name: 'isActive', label: 'Activo', type: 'switch' },
];

const columns: Column<AppUser>[] = [
  { key: 'name', header: 'Usuario', sortable: true, render: (u) => <div className="flex items-center gap-3"><Avatar name={u.name} src={u.avatarUrl} /><div><p className="font-medium">{u.name}</p><p className="text-[12px] text-ink-3">{u.email}</p></div></div> },
  { key: 'role', header: 'Cuenta', render: (u) => <Badge tone="info">{USER_ROLE[u.role]}</Badge> },
  { key: 'accessRole', header: 'Permisos', render: (u) => u.accessRole?.name ?? '—' },
  { key: 'lastLoginAt', header: 'Último acceso', sortable: true, render: (u) => fmtDateTime(u.lastLoginAt) },
  { key: 'isActive', header: 'Estado', render: (u) => <Badge tone={u.isActive ? 'success' : 'neutral'} dot>{u.isActive ? 'Activo' : 'Inactivo'}</Badge> },
];

export default function AccountantsPage() {
  const { data } = useQuery({ queryKey: ['payments', 'stats'], queryFn: () => get<any>('/payments/stats') });
  return (
    <CrudPage<AppUser>
      eyebrow="Gestión de miembros"
      title="Contadores"
      description="Cuentas con acceso al módulo contable: pagos, suscripciones, tienda y reportes."
      resource="/users"
      filters={{ role: 'ACCOUNTANT' }}
      entityName="contador"
      columns={columns}
      fields={fields}
      toPayload={(v) => ({ ...v, password: v.password || undefined })}
      emptyIcon={<Calculator />}
      above={
        <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard label="Ingresos del mes" value={fmtMoney(data?.monthTotal)} trend={data?.growth ?? undefined} icon={<Wallet />} tone="success" />
          <StatCard label="Cobros de hoy" value={fmtMoney(data?.todayTotal)} icon={<TrendingUp />} tone="brand" />
          <StatCard label="Pendiente por cobrar" value={fmtMoney(data?.pendingTotal)} hint={`${data?.pendingCount ?? 0} facturas`} icon={<Clock />} tone="warning" />
          <StatCard label="Transacciones del mes" value={data?.monthCount ?? '…'} icon={<Calculator />} tone="info" />
        </div>
      }
    />
  );
}
