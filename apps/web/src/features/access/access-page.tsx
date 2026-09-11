import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, DoorClosed, DoorOpen, KeyRound, Plus, ScrollText, Shield, Trash2, UserCog } from 'lucide-react';
import { toast } from 'sonner';
import { del, get, patch, post } from '@/lib/api';
import { cn } from '@/lib/utils';
import { fmtDateTime } from '@/lib/format';
import { ATTENDANCE_METHOD, USER_ROLE, toOptions } from '@/lib/labels';
import type { AccessLog, AppUser, Role } from '@/types';
import { useList } from '@/hooks/use-list';
import { Avatar, Badge, Button, Card, CardBody, CardHeader, ConfirmDialog, Input, Label, PageHeader, Select, Skeleton, Tabs, TabsContent, TabsList, TabsTrigger, Textarea } from '@/components/ui';
import { DataTable, type Column } from '@/components/data-table';
import { CrudPage } from '@/components/crud-page';
import type { FieldConfig } from '@/components/auto-form';

export default function AccessPage() {
  return (
    <div className="animate-slide-up">
      <PageHeader eyebrow="Sistema" title="Control de acceso" description="Roles y permisos por módulo, cuentas de usuario, registros de entrada y auditoría." />
      <Tabs defaultValue="roles">
        <TabsList className="mb-5 flex-wrap"><TabsTrigger value="roles">Roles y permisos</TabsTrigger><TabsTrigger value="usuarios">Usuarios</TabsTrigger><TabsTrigger value="accesos">Registros de acceso</TabsTrigger><TabsTrigger value="auditoria">Auditoría</TabsTrigger></TabsList>
        <TabsContent value="roles"><RolesTab /></TabsContent>
        <TabsContent value="usuarios"><UsersTab /></TabsContent>
        <TabsContent value="accesos"><AccessLogsTab /></TabsContent>
        <TabsContent value="auditoria"><AuditTab /></TabsContent>
      </Tabs>
    </div>
  );
}

function RolesTab() {
  const qc = useQueryClient();
  const { data: catalog } = useQuery({ queryKey: ['access', 'permissions'], queryFn: () => get<{ modules: { key: string; label: string }[]; actions: string[] }>('/access/permissions') });
  const { data: roles, isLoading } = useQuery({ queryKey: ['access', 'roles'], queryFn: () => get<Role[]>('/access/roles') });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<{ name: string; description: string; permissions: string[] } | null>(null);
  const [deleting, setDeleting] = useState<Role | null>(null);
  const selected = roles?.find((r) => r.id === selectedId) ?? null;
  useEffect(() => { if (!selectedId && roles?.length) setSelectedId(roles[0].id); }, [roles, selectedId]);
  useEffect(() => { if (selected) setDraft({ name: selected.name, description: selected.description ?? '', permissions: selected.permissions }); }, [selected]);
  const invalidate = () => { qc.invalidateQueries({ queryKey: ['access', 'roles'] }); qc.invalidateQueries({ queryKey: ['options', 'roles'] }); };

  const save = useMutation({ mutationFn: () => (selectedId === 'new' ? post<Role>('/access/roles', draft) : patch<Role>(`/access/roles/${selectedId}`, draft)), onSuccess: (r) => { toast.success('Rol guardado'); invalidate(); setSelectedId(r.id); }, onError: (e: Error) => toast.error(e.message) });
  const remove = useMutation({ mutationFn: (r: Role) => del(`/access/roles/${r.id}`), onSuccess: () => { toast.success('Rol eliminado'); setDeleting(null); setSelectedId(null); invalidate(); }, onError: (e: Error) => toast.error(e.message) });

  const toggle = (perm: string) => setDraft((d) => d && ({ ...d, permissions: d.permissions.includes(perm) ? d.permissions.filter((p) => p !== perm) : [...d.permissions, perm] }));
  const toggleModule = (mod: string, on: boolean) => setDraft((d) => d && ({ ...d, permissions: on ? [...new Set([...d.permissions, ...(catalog?.actions ?? []).map((a) => `${mod}.${a}`)])] : d.permissions.filter((p) => !p.startsWith(`${mod}.`)) }));
  const actionLabel: Record<string, string> = { read: 'Ver', write: 'Crear / editar', delete: 'Eliminar' };

  return (
    <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
      <Card>
        <CardHeader title="Roles" action={<Button size="sm" variant="outline" onClick={() => { setSelectedId('new'); setDraft({ name: '', description: '', permissions: [] }); }}><Plus className="h-3.5 w-3.5" />Nuevo</Button>} />
        <ul className="px-2 pb-2">
          {isLoading && <li className="p-3"><Skeleton className="h-10" /></li>}
          {roles?.map((r) => (
            <li key={r.id}><button onClick={() => setSelectedId(r.id)} className={cn('flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors', selectedId === r.id ? 'bg-brand-soft/60' : 'hover:bg-surface-2')}><span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-surface-3 text-ink-2"><Shield className="h-4 w-4" /></span><span className="min-w-0 flex-1"><span className="block truncate text-[13.5px] font-medium">{r.name}</span><span className="block text-[11.5px] text-ink-3">{r.permissions.length} permisos · {r.usersCount ?? 0} usuarios</span></span>{r.isSystem && <Badge>Sistema</Badge>}</button></li>
          ))}
          {selectedId === 'new' && <li className="rounded-xl bg-brand-soft/60 px-3 py-2.5 text-[13.5px] font-medium">Nuevo rol</li>}
        </ul>
      </Card>
      <Card>
        {!draft ? <div className="p-10 text-center text-ink-3">Selecciona un rol.</div> : (
          <>
            <CardHeader title={selectedId === 'new' ? 'Nuevo rol' : `Permisos de ${draft.name}`} description="Marca lo que este rol puede ver, crear o eliminar en cada módulo." action={<div className="flex gap-2">{selected && !selected.isSystem && <Button variant="ghost" size="sm" className="text-danger-ink" onClick={() => setDeleting(selected)}><Trash2 className="h-4 w-4" /></Button>}<Button size="sm" onClick={() => save.mutate()} loading={save.isPending} disabled={!draft.name}><Check className="h-4 w-4" />Guardar</Button></div>} />
            <CardBody className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2"><div><Label required>Nombre</Label><Input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} /></div><div><Label>Descripción</Label><Textarea rows={1} className="min-h-[38px]" value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} /></div></div>
              <div className="overflow-x-auto rounded-xl border border-line">
                <table className="w-full text-[13px]">
                  <thead><tr className="bg-surface-2/60 text-[11.5px] uppercase tracking-wider text-ink-3"><th className="px-4 py-2 text-left">Módulo</th>{catalog?.actions.map((a) => <th key={a} className="px-4 py-2 text-center">{actionLabel[a] ?? a}</th>)}<th className="px-4 py-2 text-center">Todo</th></tr></thead>
                  <tbody>{catalog?.modules.map((m) => { const all = catalog.actions.every((a) => draft.permissions.includes(`${m.key}.${a}`)); return (
                    <tr key={m.key} className="border-t border-line hover:bg-surface-2/40"><td className="px-4 py-2 font-medium">{m.label}</td>{catalog.actions.map((a) => { const key = `${m.key}.${a}`; const on = draft.permissions.includes(key); return <td key={a} className="px-4 py-2 text-center"><button type="button" onClick={() => toggle(key)} className={cn('inline-flex h-6 w-6 items-center justify-center rounded-md border transition-colors', on ? 'border-transparent bg-brand text-[#14161C]' : 'border-line-strong bg-surface hover:border-brand')}>{on && <Check className="h-3.5 w-3.5" />}</button></td>; })}<td className="px-4 py-2 text-center"><button type="button" onClick={() => toggleModule(m.key, !all)} className="text-[12px] font-medium text-brand-ink hover:underline">{all ? 'Quitar' : 'Todo'}</button></td></tr>
                  ); })}</tbody>
                </table>
              </div>
            </CardBody>
          </>
        )}
      </Card>
      <ConfirmDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)} title="Eliminar rol" description={`Los usuarios con el rol “${deleting?.name}” quedarán sin permisos asignados.`} onConfirm={() => deleting && remove.mutate(deleting)} loading={remove.isPending} />
    </div>
  );
}

const userFields: FieldConfig[] = [
  { name: 'name', label: 'Nombre completo', required: true, colSpan: 2 },
  { name: 'email', label: 'Correo', type: 'email', required: true },
  { name: 'password', label: 'Contraseña', type: 'password', hint: 'Al editar, vacío = sin cambios.' },
  { name: 'role', label: 'Tipo de cuenta', type: 'select', options: toOptions(USER_ROLE), required: true },
  { name: 'roleId', label: 'Rol de permisos', type: 'select', source: 'roles' },
  { name: 'avatarUrl', label: 'URL del avatar', type: 'url', colSpan: 2 },
  { name: 'isActive', label: 'Cuenta activa', type: 'switch' },
];
const userColumns: Column<AppUser>[] = [
  { key: 'name', header: 'Usuario', sortable: true, render: (u) => <div className="flex items-center gap-3"><Avatar name={u.name} src={u.avatarUrl} /><div><p className="font-medium">{u.name}</p><p className="text-[12px] text-ink-3">{u.email}</p></div></div> },
  { key: 'role', header: 'Cuenta', sortable: true, render: (u) => <Badge tone={u.role === 'ADMIN' ? 'brand' : 'info'}>{USER_ROLE[u.role]}</Badge> },
  { key: 'accessRole', header: 'Rol de permisos', render: (u) => u.accessRole?.name ?? <span className="text-ink-3">—</span> },
  { key: 'lastLoginAt', header: 'Último acceso', sortable: true, render: (u) => fmtDateTime(u.lastLoginAt) },
  { key: 'isActive', header: 'Estado', render: (u) => <Badge tone={u.isActive ? 'success' : 'neutral'} dot>{u.isActive ? 'Activa' : 'Inactiva'}</Badge> },
];
function UsersTab() {
  return <CrudPage<AppUser> title="Usuarios del sistema" description="Cuentas con acceso al panel de administración." resource="/users" entityName="usuario" columns={userColumns} fields={userFields} toPayload={(v) => ({ ...v, password: v.password || undefined })} emptyIcon={<UserCog />} />;
}

function AccessLogsTab() {
  const ctrl = useList<AccessLog>('/access/logs', { limit: 15 });
  const columns: Column<AccessLog>[] = [
    { key: 'at', header: 'Fecha y hora', sortable: true, render: (l) => fmtDateTime(l.at) },
    { key: 'member', header: 'Miembro', render: (l) => l.member ? <div className="flex items-center gap-2.5"><Avatar name={`${l.member.firstName} ${l.member.lastName}`} src={l.member.photoUrl} size="sm" /><Link to={`/miembros/${l.member.id}`} className="font-medium hover:underline">{l.member.firstName} {l.member.lastName}</Link></div> : '—' },
    { key: 'gate', header: 'Punto', render: (l) => l.gate ?? '—' },
    { key: 'method', header: 'Método', sortable: true, render: (l) => <Badge>{ATTENDANCE_METHOD[l.method] ?? l.method}</Badge> },
    { key: 'allowed', header: 'Resultado', sortable: true, render: (l) => l.allowed ? <Badge tone="success"><DoorOpen className="h-3 w-3" />Permitido</Badge> : <Badge tone="danger"><DoorClosed className="h-3 w-3" />Denegado · {l.reason}</Badge> },
  ];
  return <DataTable controller={ctrl} columns={columns} searchPlaceholder="Buscar miembro o motivo…" emptyIcon={<KeyRound />} emptyTitle="Sin registros"
    toolbar={<Select value={(ctrl.filters.allowed as string) ?? ''} onChange={(e) => ctrl.setFilter('allowed', e.target.value)} className="w-40"><option value="">Todos</option><option value="true">Permitidos</option><option value="false">Denegados</option></Select>} />;
}

function AuditTab() {
  const ctrl = useList<any>('/access/audit', { limit: 15 });
  const columns: Column<any>[] = [
    { key: 'createdAt', header: 'Fecha', sortable: true, render: (l) => fmtDateTime(l.createdAt) },
    { key: 'user', header: 'Usuario', render: (l) => l.user?.name ?? 'Sistema' },
    { key: 'action', header: 'Acción', sortable: true, render: (l) => <Badge tone={{ CREATE: 'success', UPDATE: 'info', DELETE: 'danger', LOGIN: 'neutral' }[l.action as string] as any ?? 'neutral'}>{l.action}</Badge> },
    { key: 'entity', header: 'Entidad', sortable: true },
    { key: 'detail', header: 'Detalle', render: (l) => <span className="text-ink-2">{l.detail ?? '—'}</span> },
  ];
  return <DataTable controller={ctrl} columns={columns} searchPlaceholder="Buscar en auditoría…" emptyIcon={<ScrollText />} emptyTitle="Sin eventos" />;
}
