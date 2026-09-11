import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { CalendarCheck, Check, Ticket, UserX, X } from 'lucide-react';
import { toast } from 'sonner';
import { get, patch } from '@/lib/api';
import { fmtDateTime, fmtMoney } from '@/lib/format';
import { BOOKING_STATUS, toOptions } from '@/lib/labels';
import type { Booking } from '@/types';
import { CrudPage } from '@/components/crud-page';
import type { Column } from '@/components/data-table';
import type { FieldConfig } from '@/components/auto-form';
import { Avatar, Badge, ColorDot, Select, StatCard, StatusBadge } from '@/components/ui';
import { useOptions } from '@/hooks/use-options';

const fields: FieldConfig[] = [
  { name: 'memberId', label: 'Miembro', type: 'select', source: 'members', required: true },
  { name: 'classId', label: 'Clase', type: 'select', source: 'classes', required: true },
  { name: 'date', label: 'Fecha y hora', type: 'datetime', required: true },
  { name: 'status', label: 'Estado', type: 'select', options: toOptions(BOOKING_STATUS) },
  { name: 'amount', label: 'Monto (vacío = tarifa de la clase)', type: 'number', step: 0.01 },
  { name: 'paid', label: 'Pagado', type: 'switch' },
];

const columns: Column<Booking>[] = [
  { key: 'member', header: 'Miembro', render: (b) => b.member ? <div className="flex items-center gap-3"><Avatar name={`${b.member.firstName} ${b.member.lastName}`} src={b.member.photoUrl} size="sm" /><Link to={`/miembros/${b.memberId}`} className="font-medium hover:underline">{b.member.firstName} {b.member.lastName}</Link></div> : '—' },
  { key: 'class', header: 'Clase', render: (b) => <span className="inline-flex items-center gap-2"><ColorDot color={b.class?.color} />{b.class?.name}</span> },
  { key: 'date', header: 'Fecha', sortable: true, render: (b) => fmtDateTime(b.date) },
  { key: 'status', header: 'Estado', sortable: true, render: (b) => <StatusBadge value={b.status} map={BOOKING_STATUS} /> },
  { key: 'paid', header: 'Pago', render: (b) => <Badge tone={b.paid ? 'success' : 'warning'}>{b.paid ? `Pagado · ${fmtMoney(b.amount)}` : `Pendiente · ${fmtMoney(b.amount)}`}</Badge> },
];

export default function BookingsPage() {
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ['bookings', 'stats'], queryFn: () => get<any>('/bookings/stats') });
  const { data: classes } = useOptions('classes');
  const setStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => patch(`/bookings/${id}`, { status }),
    onSuccess: () => { toast.success('Reserva actualizada'); qc.invalidateQueries({ queryKey: ['/bookings'] }); qc.invalidateQueries({ queryKey: ['bookings', 'stats'] }); },
  });

  return (
    <CrudPage<Booking>
      eyebrow="Entrenamiento"
      title="Reserva de clases"
      description="Cupos reservados por los miembros en las clases grupales."
      resource="/bookings"
      entityName="reserva"
      createLabel="Nueva reserva"
      columns={columns}
      fields={fields}
      emptyIcon={<Ticket />}
      searchPlaceholder="Buscar por miembro o clase…"
      rowActions={[
        { label: 'Marcar asistencia', icon: <Check />, onClick: (b) => setStatus.mutate({ id: b.id, status: 'ATTENDED' }), hidden: (b) => b.status === 'ATTENDED' },
        { label: 'Marcar no asistió', icon: <UserX />, onClick: (b) => setStatus.mutate({ id: b.id, status: 'NO_SHOW' }), hidden: (b) => b.status !== 'CONFIRMED' },
        { label: 'Cancelar reserva', icon: <X />, onClick: (b) => setStatus.mutate({ id: b.id, status: 'CANCELLED' }), hidden: (b) => b.status !== 'CONFIRMED' },
      ]}
      above={
        <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard label="Reservas de hoy" value={data?.today ?? '…'} icon={<CalendarCheck />} tone="brand" />
          <StatCard label="Confirmadas" value={data?.confirmed ?? '…'} icon={<Ticket />} tone="info" />
          <StatCard label="Asistieron" value={data?.attended ?? '…'} icon={<Check />} tone="success" />
          <StatCard label="No asistieron" value={data?.noShow ?? '…'} icon={<UserX />} tone="danger" />
        </div>
      }
      toolbar={(c) => (
        <>
          <Select value={(c.filters.status as string) ?? ''} onChange={(e) => c.setFilter('status', e.target.value)} className="w-40"><option value="">Todos los estados</option>{toOptions(BOOKING_STATUS).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</Select>
          <Select value={(c.filters.classId as string) ?? ''} onChange={(e) => c.setFilter('classId', e.target.value)} className="w-44"><option value="">Todas las clases</option>{(classes ?? []).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</Select>
        </>
      )}
    />
  );
}
