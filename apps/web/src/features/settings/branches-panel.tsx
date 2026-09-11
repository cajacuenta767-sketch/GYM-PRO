import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Building2, Pencil, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { del, get, patch, post } from '@/lib/api';
import { Badge, Button, Card, CardBody, CardHeader, ConfirmDialog, Dialog, ColorDot } from '@/components/ui';
import { AutoForm, type FieldConfig } from '@/components/auto-form';

const fields: FieldConfig[] = [
  { name: 'name', label: 'Nombre de la sede', required: true, placeholder: 'Sede Norte' },
  { name: 'color', label: 'Color', type: 'color' },
  { name: 'address', label: 'Dirección', colSpan: 2 },
  { name: 'phone', label: 'Teléfono' },
  { name: 'email', label: 'Correo', type: 'email' },
  { name: 'isActive', label: 'Activa', type: 'switch' },
];

export function BranchesPanel() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<any | 'new' | null>(null);
  const [deleting, setDeleting] = useState<any | null>(null);
  const { data } = useQuery({ queryKey: ['branches'], queryFn: () => get<any[]>('/branches') });
  const invalidate = () => { qc.invalidateQueries({ queryKey: ['branches'] }); qc.invalidateQueries({ queryKey: ['options', 'branches'] }); };
  const save = useMutation({ mutationFn: (v: any) => (editing === 'new' ? post('/branches', v) : patch(`/branches/${editing.id}`, v)), onSuccess: () => { toast.success('Sede guardada'); setEditing(null); invalidate(); }, onError: (e: Error) => toast.error(e.message) });
  const remove = useMutation({ mutationFn: (b: any) => del(`/branches/${b.id}`), onSuccess: () => { toast.success('Sede eliminada'); setDeleting(null); invalidate(); }, onError: (e: Error) => toast.error(e.message) });
  return (
    <Card>
      <CardHeader title="Sedes" description="Sucursales del gimnasio. Miembros, equipo, clases y ventas pueden asociarse a una sede." icon={<Building2 />} action={<Button size="sm" onClick={() => setEditing('new')}><Plus className="h-3.5 w-3.5" />Nueva sede</Button>} />
      <CardBody className="pt-0">
        <ul className="divide-y divide-line">
          {data?.map((b) => (
            <li key={b.id} className="flex items-center gap-3 py-3">
              <ColorDot color={b.color} className="h-3 w-3" />
              <div className="min-w-0 flex-1"><p className="font-medium">{b.name} {!b.isActive && <Badge>Inactiva</Badge>}</p><p className="truncate text-[12.5px] text-ink-2">{b.address ?? '—'}{b.phone ? ` · ${b.phone}` : ''}</p></div>
              <span className="text-[12px] text-ink-3">{b._count.members} miembros · {b._count.staff} equipo · {b._count.classes} clases</span>
              <Button variant="ghost" size="icon-sm" onClick={() => setEditing(b)}><Pencil className="h-4 w-4" /></Button>
              <Button variant="ghost" size="icon-sm" className="text-danger-ink" onClick={() => setDeleting(b)}><Trash2 className="h-4 w-4" /></Button>
            </li>
          ))}
          {data?.length === 0 && <li className="py-6 text-center text-[13px] text-ink-3">Aún no hay sedes. Si tienes una sola sucursal puedes omitir esta sección.</li>}
        </ul>
      </CardBody>
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)} title={editing === 'new' ? 'Nueva sede' : 'Editar sede'} footer={<><Button variant="ghost" onClick={() => setEditing(null)}>Cancelar</Button><Button type="submit" form="branch-form" loading={save.isPending}>Guardar</Button></>}>
        <AutoForm id="branch-form" fields={fields} defaultValues={editing === 'new' ? { color: '#22A6B3', isActive: true } : editing ?? undefined} onSubmit={(v) => save.mutate(v)} />
      </Dialog>
      <ConfirmDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)} title="Eliminar sede" description={`Los registros asociados a “${deleting?.name}” quedarán sin sede.`} onConfirm={() => deleting && remove.mutate(deleting)} loading={remove.isPending} />
    </Card>
  );
}
