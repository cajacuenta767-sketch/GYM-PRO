import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Pencil, Plus, Trash2, UsersRound } from 'lucide-react';
import { toast } from 'sonner';
import { del, get, patch, post } from '@/lib/api';
import type { Group } from '@/types';
import { AvatarGroup, Button, ConfirmDialog, Dialog, PageHeader, SearchInput, Skeleton, Avatar } from '@/components/ui';
import { AutoForm, type FieldConfig } from '@/components/auto-form';
import { useDebounce } from '@/hooks/use-debounce';

const fields: FieldConfig[] = [
  { name: 'name', label: 'Nombre del grupo', required: true, placeholder: 'Zumba' },
  { name: 'color', label: 'Color', type: 'color' },
  { name: 'description', label: 'Descripción', type: 'textarea' },
  { name: 'imageUrl', label: 'URL de imagen', type: 'url', colSpan: 2 },
  { name: 'memberIds', label: 'Miembros del grupo', type: 'multiselect', source: 'members' },
];

export default function GroupsPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const term = useDebounce(search);
  const [editing, setEditing] = useState<Group | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<Group | null>(null);
  const [viewing, setViewing] = useState<Group | null>(null);
  const { data, isLoading } = useQuery({ queryKey: ['/groups', term], queryFn: () => get<Group[]>('/groups', { limit: 100, search: term }) });
  const { data: detail } = useQuery({ queryKey: ['/groups', viewing?.id], queryFn: () => get<Group>(`/groups/${viewing!.id}`), enabled: !!viewing });
  const invalidate = () => qc.invalidateQueries({ queryKey: ['/groups'] });

  const save = useMutation({
    mutationFn: (v: any) => (editing ? patch(`/groups/${editing.id}`, v) : post('/groups', v)),
    onSuccess: () => { toast.success(editing ? 'Grupo actualizado' : 'Grupo creado'); setEditing(null); setCreating(false); invalidate(); },
    onError: (e: Error) => toast.error(e.message),
  });
  const remove = useMutation({ mutationFn: (g: Group) => del(`/groups/${g.id}`), onSuccess: () => { toast.success('Grupo eliminado'); setDeleting(null); invalidate(); } });

  return (
    <div className="animate-slide-up">
      <PageHeader eyebrow="Miembros" title="Grupos" description="Comunidades de entrenamiento para organizar a los miembros por interés u objetivo." actions={<Button onClick={() => setCreating(true)}><Plus className="h-4 w-4" />Nuevo grupo</Button>} />
      <SearchInput value={search} onChange={setSearch} placeholder="Buscar grupo…" className="mb-5 sm:w-72" />
      {isLoading ? <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-44 rounded-2xl" />)}</div> : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {data?.map((g) => (
            <div key={g.id} className="card group relative overflow-hidden p-5 transition-shadow hover:shadow-pop">
              <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full opacity-[0.12]" style={{ background: g.color }} />
              <div className="flex items-start gap-4">
                <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl font-display text-[18px] font-bold text-white" style={{ background: g.color }}>{g.name[0]}</span>
                <div className="min-w-0 flex-1">
                  <h3 className="font-display text-[16px] font-semibold">{g.name}</h3>
                  <p className="mt-0.5 line-clamp-2 text-[13px] text-ink-2">{g.description ?? 'Sin descripción'}</p>
                </div>
              </div>
              <div className="mt-5 flex items-center justify-between">
                <button onClick={() => setViewing(g)} className="flex items-center gap-2 text-left">
                  <AvatarGroup people={g.members.map((m) => ({ name: `${m.firstName} ${m.lastName}`, src: m.photoUrl }))} />
                  <span className="text-[12.5px] font-medium text-ink-2">{g.membersCount} miembros</span>
                </button>
                <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <Button variant="ghost" size="icon-sm" onClick={() => setEditing(g)}><Pencil className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon-sm" className="text-danger-ink" onClick={() => setDeleting(g)}><Trash2 className="h-4 w-4" /></Button>
                </div>
              </div>
            </div>
          ))}
          {data?.length === 0 && <div className="col-span-full card p-12 text-center text-ink-3"><UsersRound className="mx-auto mb-3 h-8 w-8" />Sin grupos.</div>}
        </div>
      )}

      <Dialog open={creating || !!editing} onOpenChange={(o) => { if (!o) { setCreating(false); setEditing(null); } }} title={editing ? 'Editar grupo' : 'Nuevo grupo'} size="lg"
        footer={<><Button variant="ghost" onClick={() => { setCreating(false); setEditing(null); }}>Cancelar</Button><Button type="submit" form="group-form" loading={save.isPending}>{editing ? 'Guardar' : 'Crear'}</Button></>}>
        <AutoForm id="group-form" fields={fields} defaultValues={editing ? { ...editing, memberIds: editing.members.map((m) => m.id) } : { color: '#7C5CFC' }} onSubmit={(v) => save.mutate(v)} />
      </Dialog>
      <Dialog open={!!viewing} onOpenChange={(o) => !o && setViewing(null)} title={viewing?.name ?? ''} description={`${detail?.membersCount ?? viewing?.membersCount ?? 0} miembros en este grupo`} size="sm">
        <ul className="divide-y divide-line">
          {(detail?.members ?? []).map((m) => (
            <li key={m.id} className="flex items-center gap-3 py-2.5">
              <Avatar name={`${m.firstName} ${m.lastName}`} src={m.photoUrl} size="sm" />
              <Link to={`/miembros/${m.id}`} className="flex-1 text-[13.5px] font-medium hover:underline">{m.firstName} {m.lastName}</Link>
              <span className="text-[12px] text-ink-3">{(m as any).code}</span>
            </li>
          ))}
          {detail && detail.members.length === 0 && <li className="py-6 text-center text-[13px] text-ink-3">Sin miembros todavía.</li>}
        </ul>
      </Dialog>
      <ConfirmDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)} title="Eliminar grupo" description={`Se eliminará el grupo “${deleting?.name}”.`} onConfirm={() => deleting && remove.mutate(deleting)} loading={remove.isPending} />
    </div>
  );
}
