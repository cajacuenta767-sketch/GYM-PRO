import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Users, UserCheck, UserX, Clock, UserPlus, Upload, Download, FileSpreadsheet } from 'lucide-react';
import { toast } from 'sonner';
import { download, get, post, upload } from '@/lib/api';
import { fmtDate, daysUntil } from '@/lib/format';
import { MEMBER_STATUS, toOptions } from '@/lib/labels';
import type { Member } from '@/types';
import { CrudPage } from '@/components/crud-page';
import type { Column } from '@/components/data-table';
import { Avatar, Badge, Button, ColorDot, Dialog, Select, StatCard, StatusBadge } from '@/components/ui';
import { useOptions } from '@/hooks/use-options';
import { memberFields, memberToForm } from './fields';

export default function MembersPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { data: stats } = useQuery({ queryKey: ['members', 'stats'], queryFn: () => get<any>('/members/stats') });
  const { data: plans } = useOptions('plans');
  const { data: branches } = useOptions('branches');
  const { data: trainers } = useOptions('trainers');
  const { data: groups } = useOptions('groups');
  const [importOpen, setImportOpen] = useState(false);
  const [importResult, setImportResult] = useState<any>(null);
  const importFile = useMutation({ mutationFn: (f: File) => upload<any>('/members/import', f), onSuccess: (r) => { setImportResult(r); toast.success(`${r.created} miembros importados`); }, onError: (e: Error) => toast.error(e.message) });
  const bulk = useMutation({ mutationFn: (v: any) => post('/members/bulk', v), onError: (e: Error) => toast.error(e.message) });

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
    { key: 'branch', header: 'Sede', render: (m: any) => m.branch?.name ?? <span className="text-ink-3">—</span> },
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
      headerActions={<>
        <Button variant="outline" onClick={() => setImportOpen(true)}><Upload className="h-4 w-4" />Importar</Button>
        <Button variant="outline" onClick={() => download('/members/export', 'miembros.csv')}><Download className="h-4 w-4" />Exportar</Button>
      </>}
      bulkBar={(ids, clear, refresh) => (
        <BulkBar ids={ids} onDone={() => { clear(); refresh(); }} run={(v) => bulk.mutateAsync({ ids, ...v })} trainers={trainers ?? []} groups={groups ?? []} branches={branches ?? []} />
      )}
      headerExtra={
        <Dialog open={importOpen} onOpenChange={(o) => { setImportOpen(o); if (!o) setImportResult(null); }} title="Importar miembros" description="Sube un archivo CSV o Excel con las columnas: nombre, apellidos, correo, telefono, genero, nacimiento, plan, direccion, estado." size="sm">
          <div className="space-y-4">
            <button onClick={() => download('/members/import/template', 'plantilla-miembros.csv')} className="inline-flex items-center gap-2 text-[13px] font-semibold text-brand-ink hover:underline"><FileSpreadsheet className="h-4 w-4" />Descargar plantilla CSV</button>
            <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-line p-8 text-center text-[13px] text-ink-2 hover:border-brand">
              <Upload className="mb-2 h-6 w-6 text-ink-3" />{importFile.isPending ? 'Importando…' : 'Haz clic para elegir el archivo (.csv, .xlsx)'}
              <input type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) importFile.mutate(f); e.target.value = ''; }} />
            </label>
            {importResult && (
              <div className="rounded-xl bg-surface-2 p-3 text-[13px]"><p><b className="text-success-ink">{importResult.created}</b> creados · <b>{importResult.skipped}</b> omitidos (correo existente) · <b className="text-danger-ink">{importResult.errors.length}</b> errores</p>{importResult.errors.slice(0, 5).map((e: string) => <p key={e} className="mt-1 text-[12px] text-danger-ink">{e}</p>)}</div>
            )}
          </div>
        </Dialog>
      }
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
          {!!branches?.length && (
            <Select value={(c.filters.branchId as string) ?? ''} onChange={(e) => c.setFilter('branchId', e.target.value)} className="w-40">
              <option value="">Todas las sedes</option>
              {branches.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </Select>
          )}
        </>
      )}
    />
  );
}

function BulkBar({ ids, run, onDone, trainers, groups, branches }: { ids: string[]; run: (v: any) => Promise<any>; onDone: () => void; trainers: any[]; groups: any[]; branches: any[] }) {
  const [status, setStatus] = useState('');
  const [trainerId, setTrainerId] = useState('');
  const [groupId, setGroupId] = useState('');
  const [branchId, setBranchId] = useState('');
  const [busy, setBusy] = useState(false);
  const apply = async () => {
    const v: any = {};
    if (status) v.status = status; if (trainerId) v.trainerId = trainerId; if (groupId) v.groupId = groupId; if (branchId) v.branchId = branchId;
    if (!Object.keys(v).length) { toast.info('Elige al menos una acción'); return; }
    setBusy(true);
    try { await run(v); toast.success(`${ids.length} miembros actualizados`); onDone(); } finally { setBusy(false); }
  };
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select value={status} onChange={(e) => setStatus(e.target.value)} className="h-8 w-36 text-[12.5px]"><option value="">Cambiar estado…</option>{toOptions(MEMBER_STATUS).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</Select>
      <Select value={trainerId} onChange={(e) => setTrainerId(e.target.value)} className="h-8 w-40 text-[12.5px]"><option value="">Asignar entrenador…</option>{trainers.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</Select>
      <Select value={groupId} onChange={(e) => setGroupId(e.target.value)} className="h-8 w-36 text-[12.5px]"><option value="">Añadir a grupo…</option>{groups.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</Select>
      {!!branches.length && <Select value={branchId} onChange={(e) => setBranchId(e.target.value)} className="h-8 w-36 text-[12.5px]"><option value="">Mover a sede…</option>{branches.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</Select>}
      <Button size="sm" onClick={apply} loading={busy}>Aplicar</Button>
    </div>
  );
}
