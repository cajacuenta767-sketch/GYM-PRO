import { UsersRound } from 'lucide-react';
import { fmtDate } from '@/lib/format';
import { STAFF_ROLE, toOptions } from '@/lib/labels';
import type { Staff } from '@/types';
import { CrudPage } from '@/components/crud-page';
import type { Column } from '@/components/data-table';
import type { FieldConfig } from '@/components/auto-form';
import { Avatar, Badge, Select } from '@/components/ui';

const fields: FieldConfig[] = [
  { name: 'firstName', label: 'Nombre', required: true },
  { name: 'lastName', label: 'Apellidos', required: true },
  { name: 'role', label: 'Cargo', type: 'select', options: toOptions(STAFF_ROLE), required: true },
  { name: 'specialty', label: 'Especialidad', placeholder: 'Fuerza, yoga, nutrición…' },
  { name: 'email', label: 'Correo', type: 'email' },
  { name: 'phone', label: 'Teléfono', type: 'tel' },
  { name: 'hireDate', label: 'Fecha de contratación', type: 'date' },
  { name: 'salary', label: 'Salario mensual', type: 'number', step: 0.01 },
  { name: 'branchId', label: 'Sede', type: 'select', source: 'branches' },
  { name: 'photoUrl', label: 'Foto', type: 'image' },
  { name: 'bio', label: 'Biografía', type: 'textarea' },
  { name: 'isActive', label: 'Activo', type: 'switch' },
];

const columns: Column<Staff>[] = [
  { key: 'firstName', header: 'Nombre', sortable: true, render: (s) => (
    <div className="flex items-center gap-3"><Avatar name={`${s.firstName} ${s.lastName}`} src={s.photoUrl} /><div className="min-w-0"><p className="truncate font-medium">{s.firstName} {s.lastName}</p><p className="truncate text-[12px] text-ink-3">{s.code} · {s.email ?? '—'}</p></div></div>
  ) },
  { key: 'role', header: 'Cargo', sortable: true, render: (s) => <Badge tone={s.role === 'TRAINER' ? 'brand' : s.role === 'MANAGER' ? 'info' : 'neutral'}>{STAFF_ROLE[s.role] ?? s.role}</Badge> },
  { key: 'specialty', header: 'Especialidad', render: (s) => s.specialty ?? '—' },
  { key: 'load', header: 'Carga', render: (s) => <span className="text-ink-2">{s._count?.members ?? 0} miembros · {s._count?.classes ?? 0} clases</span> },
  { key: 'phone', header: 'Teléfono', render: (s) => s.phone ?? '—' },
  { key: 'hireDate', header: 'Ingreso', sortable: true, render: (s) => fmtDate(s.hireDate) },
  { key: 'isActive', header: 'Estado', render: (s) => <Badge tone={s.isActive ? 'success' : 'neutral'} dot>{s.isActive ? 'Activo' : 'Inactivo'}</Badge> },
];

export default function StaffPage() {
  return (
    <CrudPage<Staff>
      eyebrow="Gestión de miembros"
      title="Miembros del equipo"
      description="Entrenadores, recepción, nutrición y administración del gimnasio."
      resource="/staff"
      entityName="integrante"
      createLabel="Nuevo integrante"
      columns={columns}
      fields={fields}
      emptyIcon={<UsersRound />}
      searchPlaceholder="Buscar por nombre, código o especialidad…"
      toolbar={(c) => (
        <Select value={(c.filters.role as string) ?? ''} onChange={(e) => c.setFilter('role', e.target.value)} className="w-44">
          <option value="">Todos los cargos</option>
          {toOptions(STAFF_ROLE).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </Select>
      )}
    />
  );
}
