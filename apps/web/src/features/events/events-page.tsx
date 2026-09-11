import { useQuery } from '@tanstack/react-query';
import { CalendarRange, MapPin, Users } from 'lucide-react';
import { get } from '@/lib/api';
import { fmtDate, fmtDateTime, fmtMoney } from '@/lib/format';
import { EVENT_TYPE, toOptions } from '@/lib/labels';
import type { GymEvent } from '@/types';
import { CrudPage } from '@/components/crud-page';
import type { Column } from '@/components/data-table';
import type { FieldConfig } from '@/components/auto-form';
import { Badge, Select, StatusBadge } from '@/components/ui';

const fields: FieldConfig[] = [
  { name: 'title', label: 'Título', required: true, colSpan: 2, placeholder: 'Carrera 5K GYM PRO' },
  { name: 'type', label: 'Tipo', type: 'select', options: toOptions(EVENT_TYPE), required: true },
  { name: 'color', label: 'Color', type: 'color' },
  { name: 'startsAt', label: 'Inicio', type: 'datetime', required: true },
  { name: 'endsAt', label: 'Fin', type: 'datetime' },
  { name: 'location', label: 'Lugar', placeholder: 'Sala principal' },
  { name: 'capacity', label: 'Capacidad', type: 'number' },
  { name: 'fee', label: 'Costo de inscripción', type: 'number', step: 0.01 },
  { name: 'isPublic', label: 'Visible para miembros', type: 'switch' },
  { name: 'description', label: 'Descripción', type: 'textarea' },
];

const columns: Column<GymEvent>[] = [
  { key: 'startsAt', header: 'Fecha', sortable: true, render: (e) => (
    <div className="flex items-center gap-3">
      <span className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-xl text-white" style={{ background: e.color }}><span className="text-[9.5px] font-semibold uppercase leading-none">{fmtDate(e.startsAt, 'MMM')}</span><span className="font-display text-[16px] font-bold leading-tight">{fmtDate(e.startsAt, 'd')}</span></span>
      <div><p className="font-medium">{e.title}</p><p className="text-[12px] text-ink-3">{fmtDateTime(e.startsAt)}{e.endsAt ? ` → ${fmtDate(e.endsAt, 'HH:mm')}` : ''}</p></div>
    </div>
  ) },
  { key: 'type', header: 'Tipo', sortable: true, render: (e) => <StatusBadge value={e.type} map={EVENT_TYPE} /> },
  { key: 'location', header: 'Lugar', render: (e) => e.location ? <span className="inline-flex items-center gap-1 text-ink-2"><MapPin className="h-3.5 w-3.5" />{e.location}</span> : '—' },
  { key: 'rsvps', header: 'Inscritos', render: (e) => <span className="inline-flex items-center gap-1"><Users className="h-3.5 w-3.5 text-ink-3" />{e._count?.rsvps ?? 0}{e.capacity ? ` / ${e.capacity}` : ''}</span> },
  { key: 'fee', header: 'Costo', render: (e) => e.fee ? fmtMoney(e.fee) : <Badge tone="success">Gratis</Badge> },
];

export default function EventsPage() {
  const { data: upcoming } = useQuery({ queryKey: ['events', 'upcoming'], queryFn: () => get<GymEvent[]>('/events/upcoming') });
  return (
    <CrudPage<GymEvent>
      eyebrow="Entrenamiento"
      title="Eventos"
      description="Competencias, talleres, jornadas especiales y cierres programados."
      resource="/events"
      entityName="evento"
      columns={columns}
      fields={fields}
      emptyIcon={<CalendarRange />}
      above={!!upcoming?.length && (
        <div className="mb-6 flex gap-3 overflow-x-auto pb-1 scrollbar-thin">
          {upcoming.map((e) => (
            <div key={e.id} className="card min-w-[240px] shrink-0 overflow-hidden">
              <div className="h-1.5" style={{ background: e.color }} />
              <div className="p-4">
                <div className="flex items-center justify-between"><StatusBadge value={e.type} map={EVENT_TYPE} /><span className="text-[11.5px] text-ink-3">{e._count?.rsvps ?? 0} inscritos</span></div>
                <p className="mt-2 font-display text-[14.5px] font-semibold leading-tight">{e.title}</p>
                <p className="mt-1 text-[12px] text-ink-2">{fmtDateTime(e.startsAt)}</p>
                <p className="text-[12px] text-ink-3">{e.location}</p>
              </div>
            </div>
          ))}
        </div>
      )}
      toolbar={(c) => (
        <Select value={(c.filters.type as string) ?? ''} onChange={(e) => c.setFilter('type', e.target.value)} className="w-40"><option value="">Todos los tipos</option>{toOptions(EVENT_TYPE).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</Select>
      )}
    />
  );
}
