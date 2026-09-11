import { useQuery } from '@tanstack/react-query';
import { Megaphone, Pin } from 'lucide-react';
import { get } from '@/lib/api';
import { cn } from '@/lib/utils';
import { fmtDate, fmtDateTime } from '@/lib/format';
import { AUDIENCE, NOTICE_TYPE, toOptions } from '@/lib/labels';
import type { Notice } from '@/types';
import { CrudPage } from '@/components/crud-page';
import type { Column } from '@/components/data-table';
import type { FieldConfig } from '@/components/auto-form';
import { Badge, Select, StatusBadge } from '@/components/ui';

const fields: FieldConfig[] = [
  { name: 'title', label: 'Título', required: true, colSpan: 2 },
  { name: 'type', label: 'Tipo', type: 'select', options: toOptions(NOTICE_TYPE), required: true },
  { name: 'audience', label: 'Audiencia', type: 'select', options: toOptions(AUDIENCE) },
  { name: 'startsAt', label: 'Visible desde', type: 'datetime' },
  { name: 'endsAt', label: 'Visible hasta', type: 'datetime' },
  { name: 'isPinned', label: 'Fijar arriba', type: 'switch' },
  { name: 'content', label: 'Contenido', type: 'textarea', required: true },
];

const columns: Column<Notice>[] = [
  { key: 'title', header: 'Aviso', sortable: true, render: (n) => <div className="flex items-start gap-2">{n.isPinned && <Pin className="mt-1 h-3.5 w-3.5 text-brand-ink" />}<div><p className="font-medium">{n.title}</p><p className="line-clamp-1 text-[12px] text-ink-3">{n.content}</p></div></div> },
  { key: 'type', header: 'Tipo', sortable: true, render: (n) => <StatusBadge value={n.type} map={NOTICE_TYPE} /> },
  { key: 'audience', header: 'Audiencia', render: (n) => AUDIENCE[n.audience] ?? n.audience },
  { key: 'startsAt', header: 'Vigencia', sortable: true, render: (n) => <span>{fmtDate(n.startsAt)} → {n.endsAt ? fmtDate(n.endsAt) : 'sin fin'}</span> },
  { key: 'active', header: 'Estado', render: (n) => { const now = Date.now(); const on = new Date(n.startsAt).getTime() <= now && (!n.endsAt || new Date(n.endsAt).getTime() >= now); return <Badge tone={on ? 'success' : 'neutral'} dot>{on ? 'Activo' : 'Inactivo'}</Badge>; } },
];

const tone: Record<string, string> = { INFO: 'border-info/30 bg-info-soft', WARNING: 'border-warning/30 bg-warning-soft', URGENT: 'border-danger/30 bg-danger-soft', PROMO: 'border-brand/40 bg-brand-soft' };

export default function NoticesPage() {
  const { data: active } = useQuery({ queryKey: ['notices', 'active'], queryFn: () => get<Notice[]>('/notices/active') });
  return (
    <CrudPage<Notice>
      eyebrow="Comunicación"
      title="Avisos"
      description="Anuncios visibles en el panel y para los miembros: mantenimientos, promociones y alertas."
      resource="/notices"
      entityName="aviso"
      columns={columns}
      fields={fields}
      emptyIcon={<Megaphone />}
      above={!!active?.length && (
        <div className="mb-6 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {active.slice(0, 3).map((n) => (
            <div key={n.id} className={cn('rounded-2xl border p-4', tone[n.type])}>
              <div className="flex items-center justify-between gap-2"><StatusBadge value={n.type} map={NOTICE_TYPE} />{n.isPinned && <Pin className="h-3.5 w-3.5 text-ink-2" />}</div>
              <p className="mt-2 font-display text-[14.5px] font-semibold">{n.title}</p>
              <p className="mt-1 line-clamp-3 text-[13px] text-ink-2">{n.content}</p>
              <p className="mt-2 text-[11.5px] text-ink-3">{fmtDateTime(n.startsAt)}</p>
            </div>
          ))}
        </div>
      )}
      toolbar={(c) => <Select value={(c.filters.type as string) ?? ''} onChange={(e) => c.setFilter('type', e.target.value)} className="w-40"><option value="">Todos los tipos</option>{toOptions(NOTICE_TYPE).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</Select>}
    />
  );
}
