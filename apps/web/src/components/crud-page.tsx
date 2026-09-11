import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { del, patch, post } from '@/lib/api';
import { useList } from '@/hooks/use-list';
import { Button, ConfirmDialog, Dialog, PageHeader } from '@/components/ui';
import { DataTable, type Column, type RowAction } from './data-table';
import { AutoForm, type FieldConfig } from './auto-form';

interface CrudPageProps<T extends { id: string }> {
  title: string;
  description?: string;
  eyebrow?: string;
  resource: string;               // "/members"
  entityName: string;             // "miembro"
  columns: Column<T>[];
  fields: FieldConfig[];
  /** Transforma la fila en valores por defecto del formulario (para editar). */
  toForm?: (row: T) => Record<string, any>;
  /** Transforma los valores del formulario antes de enviarlos. */
  toPayload?: (values: any, editing?: T) => any;
  searchPlaceholder?: string;
  initialLimit?: number;
  initialSort?: { sortBy: string; sortDir: 'asc' | 'desc' };
  filters?: Record<string, unknown>;
  toolbar?: (ctrl: ReturnType<typeof useList<T>>) => React.ReactNode;
  headerActions?: React.ReactNode;
  headerExtra?: React.ReactNode;
  rowActions?: RowAction<T>[];
  onView?: (row: T) => void;
  onRowClick?: (row: T) => void;
  canCreate?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
  dialogSize?: 'sm' | 'md' | 'lg' | 'xl';
  emptyIcon?: React.ReactNode;
  mobileTitle?: (row: T) => React.ReactNode;
  createLabel?: string;
  above?: React.ReactNode;
  /** Abre el diálogo de creación al montar (p. ej. desde ?nuevo=1). */
  initialCreate?: boolean;
}

/**
 * Página CRUD completa: cabecera, tabla paginada, crear/editar en diálogo y eliminar con confirmación.
 * Cubre la mayoría de los apartados del sistema con una configuración declarativa.
 */
export function CrudPage<T extends { id: string }>(p: CrudPageProps<T>) {
  const qc = useQueryClient();
  const ctrl = useList<T>(p.resource, { limit: p.initialLimit ?? 10, filters: p.filters ?? {}, ...(p.initialSort ?? {}) });
  const [editing, setEditing] = useState<T | null>(null);
  const [creating, setCreating] = useState(!!p.initialCreate);
  const [deleting, setDeleting] = useState<T | null>(null);

  const invalidate = () => qc.invalidateQueries({ queryKey: [p.resource] });

  const save = useMutation({
    mutationFn: (values: any) => {
      const payload = p.toPayload ? p.toPayload(values, editing ?? undefined) : values;
      return editing ? patch(`${p.resource}/${editing.id}`, payload) : post(p.resource, payload);
    },
    onSuccess: () => {
      toast.success(editing ? `${cap(p.entityName)} actualizado` : `${cap(p.entityName)} creado`);
      setEditing(null); setCreating(false); invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: (row: T) => del(`${p.resource}/${row.id}`),
    onSuccess: () => { toast.success(`${cap(p.entityName)} eliminado`); setDeleting(null); invalidate(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const open = creating || !!editing;

  return (
    <div className="animate-slide-up">
      <PageHeader
        eyebrow={p.eyebrow}
        title={p.title}
        description={p.description}
        actions={<>
          {p.headerActions}
          {p.canCreate !== false && (
            <Button onClick={() => setCreating(true)}><Plus className="h-4 w-4" />{p.createLabel ?? `Nuevo ${p.entityName}`}</Button>
          )}
        </>}
      />
      {p.above}
      {p.headerExtra}
      <DataTable
        controller={ctrl}
        columns={p.columns}
        searchPlaceholder={p.searchPlaceholder}
        toolbar={p.toolbar?.(ctrl)}
        onView={p.onView}
        onEdit={p.canEdit !== false ? (row) => setEditing(row) : undefined}
        onDelete={p.canDelete !== false ? (row) => setDeleting(row) : undefined}
        onRowClick={p.onRowClick}
        actions={p.rowActions}
        emptyIcon={p.emptyIcon}
        mobileTitle={p.mobileTitle}
        emptyDescription={`Aún no hay ${p.entityName}s registrados o ninguno coincide con la búsqueda.`}
      />

      <Dialog
        open={open}
        onOpenChange={(o) => { if (!o) { setEditing(null); setCreating(false); } }}
        title={editing ? `Editar ${p.entityName}` : `Nuevo ${p.entityName}`}
        size={p.dialogSize ?? 'md'}
        footer={<>
          <Button variant="ghost" onClick={() => { setEditing(null); setCreating(false); }}>Cancelar</Button>
          <Button type="submit" form="crud-form" loading={save.isPending}>{editing ? 'Guardar cambios' : 'Crear'}</Button>
        </>}
      >
        <AutoForm id="crud-form" fields={p.fields} defaultValues={editing ? (p.toForm ? p.toForm(editing) : (editing as any)) : undefined} onSubmit={(v) => save.mutate(v)} />
      </Dialog>

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title={`Eliminar ${p.entityName}`}
        description={`Se eliminará este ${p.entityName} de forma permanente junto con su información relacionada.`}
        onConfirm={() => deleting && remove.mutate(deleting)}
        loading={remove.isPending}
      />
    </div>
  );
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
