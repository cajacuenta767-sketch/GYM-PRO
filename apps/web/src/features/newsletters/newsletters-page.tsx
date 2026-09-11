import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Newspaper, Send } from 'lucide-react';
import { toast } from 'sonner';
import { post } from '@/lib/api';
import { fmtDateTime } from '@/lib/format';
import { AUDIENCE, NEWSLETTER_STATUS, toOptions } from '@/lib/labels';
import type { Newsletter } from '@/types';
import { CrudPage } from '@/components/crud-page';
import type { Column } from '@/components/data-table';
import type { FieldConfig } from '@/components/auto-form';
import { Badge, Select, StatusBadge } from '@/components/ui';

const fields: FieldConfig[] = [
  { name: 'title', label: 'Título interno', required: true, colSpan: 2, placeholder: 'Novedades de septiembre' },
  { name: 'subject', label: 'Asunto del correo', required: true, colSpan: 2 },
  { name: 'audience', label: 'Audiencia', type: 'select', options: toOptions(AUDIENCE), required: true },
  { name: 'scheduledAt', label: 'Programar envío (opcional)', type: 'datetime' },
  { name: 'content', label: 'Contenido', type: 'textarea', required: true },
];

const columns: Column<Newsletter>[] = [
  { key: 'title', header: 'Boletín', sortable: true, render: (n) => <div><p className="font-medium">{n.title}</p><p className="line-clamp-1 text-[12px] text-ink-3">{n.subject}</p></div> },
  { key: 'audience', header: 'Audiencia', render: (n) => <Badge>{AUDIENCE[n.audience] ?? n.audience}</Badge> },
  { key: 'status', header: 'Estado', sortable: true, render: (n) => <StatusBadge value={n.status} map={NEWSLETTER_STATUS} /> },
  { key: 'sentAt', header: 'Envío', sortable: true, render: (n) => n.status === 'SENT' ? fmtDateTime(n.sentAt) : n.status === 'SCHEDULED' ? <span className="text-warning-ink">Programado · {fmtDateTime(n.scheduledAt)}</span> : <span className="text-ink-3">—</span> },
  { key: 'recipientsCount', header: 'Destinatarios', render: (n) => n.status === 'SENT' ? n.recipientsCount : '—' },
  { key: 'openRate', header: 'Apertura', render: (n) => n.openRate != null ? <Badge tone={n.openRate >= 50 ? 'success' : 'warning'}>{n.openRate}%</Badge> : '—' },
];

export default function NewslettersPage() {
  const qc = useQueryClient();
  const send = useMutation({ mutationFn: (n: Newsletter) => post(`/newsletters/${n.id}/send`), onSuccess: (r: any) => { toast.success(`Boletín enviado a ${r.recipientsCount} destinatarios`); qc.invalidateQueries({ queryKey: ['/newsletters'] }); }, onError: (e: Error) => toast.error(e.message) });
  return (
    <CrudPage<Newsletter>
      eyebrow="Comunicación"
      title="Boletín informativo"
      description="Campañas de correo para miembros y equipo: novedades, promociones y guías."
      resource="/newsletters"
      entityName="boletín"
      columns={columns}
      fields={fields}
      dialogSize="lg"
      emptyIcon={<Newspaper />}
      rowActions={[{ label: 'Enviar ahora', icon: <Send />, onClick: (n) => send.mutate(n), hidden: (n) => n.status === 'SENT' }]}
      toolbar={(c) => <Select value={(c.filters.status as string) ?? ''} onChange={(e) => c.setFilter('status', e.target.value)} className="w-40"><option value="">Todos los estados</option>{toOptions(NEWSLETTER_STATUS).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</Select>}
    />
  );
}
