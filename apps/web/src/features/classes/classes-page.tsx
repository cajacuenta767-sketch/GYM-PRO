import { useNavigate } from 'react-router-dom';
import { CalendarDays, Dumbbell } from 'lucide-react';
import { DAYS_SHORT_ES, fmtMoney } from '@/lib/format';
import type { GymClass } from '@/types';
import { CrudPage } from '@/components/crud-page';
import type { Column } from '@/components/data-table';
import type { FieldConfig } from '@/components/auto-form';
import { Avatar, Badge, Button, ColorDot } from '@/components/ui';
import { ScheduleEditor } from './schedule-editor';

const fields: FieldConfig[] = [
  { name: 'name', label: 'Nombre de la clase', required: true, placeholder: 'Clase de Yoga' },
  { name: 'trainerId', label: 'Instructor', type: 'select', source: 'trainers' },
  { name: 'location', label: 'Ubicación', placeholder: 'Sala principal' },
  { name: 'branchId', label: 'Sede', type: 'select', source: 'branches' },
  { name: 'color', label: 'Color', type: 'color' },
  { name: 'capacity', label: 'Capacidad', type: 'number', min: 1, required: true },
  { name: 'bookingFee', label: 'Tarifa de reserva', type: 'number', step: 0.01 },
  { name: 'description', label: 'Descripción', type: 'textarea' },
  { name: 'schedules', label: 'Horarios semanales', type: 'custom', render: (v, onChange) => <ScheduleEditor value={v} onChange={onChange} /> },
  { name: 'isActive', label: 'Clase activa', type: 'switch' },
];

const columns: Column<GymClass>[] = [
  { key: 'name', header: 'Clase', sortable: true, render: (c) => <div className="flex items-center gap-3"><span className="h-9 w-1.5 rounded-full" style={{ background: c.color }} /><div><p className="font-medium">{c.name}</p><p className="text-[12px] text-ink-3">{c.location ?? 'Sin ubicación'}</p></div></div> },
  { key: 'trainer', header: 'Instructor', render: (c) => c.trainer ? <span className="inline-flex items-center gap-2"><Avatar name={`${c.trainer.firstName} ${c.trainer.lastName}`} src={c.trainer.photoUrl} size="xs" />{c.trainer.firstName} {c.trainer.lastName}</span> : '—' },
  { key: 'schedules', header: 'Horario', render: (c) => <div className="flex flex-wrap gap-1">{c.schedules.map((s) => <Badge key={s.id} tone="neutral">{DAYS_SHORT_ES[s.dayOfWeek]} {s.startTime}–{s.endTime}</Badge>)}{!c.schedules.length && <span className="text-ink-3">Sin horario</span>}</div> },
  { key: 'capacity', header: 'Cupo', sortable: true, render: (c) => <span>{c._count?.members ?? 0} / {c.capacity}</span> },
  { key: 'bookingFee', header: 'Tarifa', sortable: true, render: (c) => fmtMoney(c.bookingFee) },
  { key: 'isActive', header: 'Estado', render: (c) => <Badge tone={c.isActive ? 'success' : 'neutral'} dot>{c.isActive ? 'Activa' : 'Inactiva'}</Badge> },
];

export default function ClassesPage() {
  const navigate = useNavigate();
  return (
    <CrudPage<GymClass>
      eyebrow="Entrenamiento"
      title="Lista de clases"
      description="Clases grupales, instructores, cupos y horarios semanales."
      resource="/classes"
      entityName="clase"
      createLabel="Agregar clase"
      columns={columns}
      fields={fields}
      dialogSize="lg"
      toForm={(c) => ({ ...c, schedules: c.schedules.map((s) => ({ dayOfWeek: s.dayOfWeek, startTime: s.startTime, endTime: s.endTime })) })}
      emptyIcon={<Dumbbell />}
      mobileTitle={(c) => <span className="inline-flex items-center gap-2"><ColorDot color={c.color} />{c.name}</span>}
      headerActions={<Button variant="outline" onClick={() => navigate('/clases/horario')}><CalendarDays className="h-4 w-4" />Horario de clases</Button>}
    />
  );
}
