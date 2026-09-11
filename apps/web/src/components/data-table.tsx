import { useState } from 'react';
import { ArrowDown, ArrowUp, ArrowUpDown, Check, Eye, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button, Dropdown, DropdownContent, DropdownItem, DropdownTrigger, EmptyState, Pagination, SearchInput, Skeleton } from '@/components/ui';
import type { ListController } from '@/hooks/use-list';

export interface Column<T> {
  key: string;
  header: React.ReactNode;
  render?: (row: T) => React.ReactNode;
  sortable?: boolean;
  className?: string;
  /** Oculta la columna en pantallas pequeñas (queda dentro de la tarjeta móvil). */
  hideOnMobile?: boolean;
  /** Etiqueta usada en la tarjeta móvil (por defecto usa header). */
  mobileLabel?: string;
  width?: string;
}

export interface RowAction<T> {
  label: string;
  icon?: React.ReactNode;
  onClick: (row: T) => void;
  danger?: boolean;
  hidden?: (row: T) => boolean;
}

interface Props<T extends { id: string }> {
  controller: ListController<T>;
  columns: Column<T>[];
  actions?: RowAction<T>[];
  onView?: (row: T) => void;
  onEdit?: (row: T) => void;
  onDelete?: (row: T) => void;
  onRowClick?: (row: T) => void;
  searchPlaceholder?: string;
  toolbar?: React.ReactNode;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyIcon?: React.ReactNode;
  /** Primer columna en modo tarjeta (título). */
  mobileTitle?: (row: T) => React.ReactNode;
  hideSearch?: boolean;
  dense?: boolean;
  /** Barra de acciones en lote; al definirla aparece una columna de selección. */
  bulkBar?: (ids: string[], clear: () => void) => React.ReactNode;
}

export function DataTable<T extends { id: string }>({
  controller: c, columns, actions = [], onView, onEdit, onDelete, onRowClick, searchPlaceholder, toolbar,
  emptyTitle = 'Sin resultados', emptyDescription = 'No hay registros que coincidan con la búsqueda.', emptyIcon, mobileTitle, hideSearch, dense, bulkBar,
}: Props<T>) {
  const loading = c.query.isLoading;
  const rows = c.rows;
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const selectable = !!bulkBar;
  const allSelected = rows.length > 0 && rows.every((r) => selected.has(r.id));
  const toggleAll = () => setSelected((s) => { const n = new Set(s); if (allSelected) rows.forEach((r) => n.delete(r.id)); else rows.forEach((r) => n.add(r.id)); return n; });
  const toggle = (id: string) => setSelected((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  const clear = () => setSelected(new Set());
  const hasActions = !!(onView || onEdit || onDelete || actions.length);

  const rowActions = (row: T): RowAction<T>[] => {
    const all: RowAction<T>[] = [
      ...(onView ? [{ label: 'Ver detalle', icon: <Eye />, onClick: onView }] : []),
      ...(onEdit ? [{ label: 'Editar', icon: <Pencil />, onClick: onEdit }] : []),
      ...actions,
      ...(onDelete ? [{ label: 'Eliminar', icon: <Trash2 />, onClick: onDelete, danger: true }] : []),
    ];
    return all.filter((a) => !a.hidden?.(row));
  };

  return (
    <div className="card overflow-hidden">
      {(!hideSearch || toolbar) && (
        <div className="flex flex-col gap-3 border-b border-line px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          {!hideSearch ? <SearchInput value={c.search} onChange={c.setSearch} placeholder={searchPlaceholder} className="sm:w-72" /> : <div />}
          {toolbar && <div className="flex flex-wrap items-center gap-2">{toolbar}</div>}
        </div>
      )}

      {selectable && selected.size > 0 && (
        <div className="flex flex-wrap items-center gap-3 border-b border-line bg-brand-soft/50 px-4 py-2.5 animate-fade-in">
          <span className="text-[13px] font-semibold text-brand-ink">{selected.size} seleccionados</span>
          {bulkBar([...selected], clear)}
          <button onClick={clear} className="ml-auto text-[12.5px] font-medium text-ink-2 hover:text-ink">Limpiar</button>
        </div>
      )}

      {/* ── Escritorio ── */}
      <div className="hidden md:block overflow-x-auto scrollbar-thin">
        <table className="w-full text-[13.5px]">
          <thead>
            <tr className="border-b border-line bg-surface-2/60">
              {selectable && <th className="w-10 px-3"><Checkbox checked={allSelected} onChange={toggleAll} /></th>}
              {columns.map((col) => (
                <th key={col.key} style={{ width: col.width }} className={cn('px-4 py-2.5 text-left text-[11.5px] font-semibold uppercase tracking-[0.06em] text-ink-3 whitespace-nowrap', col.className)}>
                  {col.sortable ? (
                    <button onClick={() => c.setSort(col.key)} className="inline-flex items-center gap-1 uppercase tracking-[0.06em] hover:text-ink transition-colors">
                      {col.header}
                      {c.sortBy === col.key ? (c.sortDir === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />) : <ArrowUpDown className="h-3 w-3 opacity-50" />}
                    </button>
                  ) : col.header}
                </th>
              ))}
              {hasActions && <th className="px-4 py-2.5 w-12" />}
            </tr>
          </thead>
          <tbody>
            {loading && Array.from({ length: 6 }).map((_, i) => (
              <tr key={i} className="border-b border-line last:border-0">
                {selectable && <td />}
                {columns.map((col) => <td key={col.key} className="px-4 py-3.5"><Skeleton className="h-3.5 w-[70%]" /></td>)}
                {hasActions && <td />}
              </tr>
            ))}
            {!loading && rows.map((row) => (
              <tr key={row.id} onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={cn('border-b border-line last:border-0 transition-colors hover:bg-surface-2/70', onRowClick && 'cursor-pointer', c.query.isFetching && 'opacity-70', selected.has(row.id) && 'bg-brand-soft/30')}>
                {selectable && <td className="px-3" onClick={(e) => e.stopPropagation()}><Checkbox checked={selected.has(row.id)} onChange={() => toggle(row.id)} /></td>}
                {columns.map((col) => (
                  <td key={col.key} className={cn('px-4 align-middle', dense ? 'py-2' : 'py-3', col.className)}>
                    {col.render ? col.render(row) : String((row as any)[col.key] ?? '—')}
                  </td>
                ))}
                {hasActions && (
                  <td className="px-2 py-2 text-right" onClick={(e) => e.stopPropagation()}>
                    <ActionsMenu actions={rowActions(row)} row={row} />
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && rows.length === 0 && <EmptyState icon={emptyIcon} title={emptyTitle} description={emptyDescription} />}
      </div>

      {/* ── Móvil: tarjetas ── */}
      <div className="md:hidden divide-y divide-line">
        {loading && Array.from({ length: 4 }).map((_, i) => <div key={i} className="p-4 space-y-2"><Skeleton className="h-4 w-1/2" /><Skeleton className="h-3 w-1/3" /></div>)}
        {!loading && rows.map((row) => {
          const [first, ...rest] = columns;
          return (
            <div key={row.id} className="p-4" onClick={onRowClick ? () => onRowClick(row) : undefined}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1 text-[14px] font-medium">{mobileTitle ? mobileTitle(row) : first.render ? first.render(row) : String((row as any)[first.key] ?? '')}</div>
                {hasActions && <div onClick={(e) => e.stopPropagation()}><ActionsMenu actions={rowActions(row)} row={row} /></div>}
              </div>
              <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2">
                {rest.map((col) => (
                  <div key={col.key} className="min-w-0">
                    <dt className="text-[11px] font-semibold uppercase tracking-wider text-ink-3">{col.mobileLabel ?? (typeof col.header === 'string' ? col.header : col.key)}</dt>
                    <dd className="mt-0.5 text-[13px] text-ink truncate">{col.render ? col.render(row) : String((row as any)[col.key] ?? '—')}</dd>
                  </div>
                ))}
              </dl>
            </div>
          );
        })}
        {!loading && rows.length === 0 && <EmptyState icon={emptyIcon} title={emptyTitle} description={emptyDescription} />}
      </div>

      <div className="border-t border-line px-4 py-3">
        <Pagination page={c.meta.page} pages={c.meta.pages} total={c.meta.total} limit={c.meta.limit} onPage={c.setPage} onLimit={c.setLimit} />
      </div>
    </div>
  );
}

function Checkbox({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button type="button" role="checkbox" aria-checked={checked} onClick={onChange} className={cn('inline-flex h-[18px] w-[18px] items-center justify-center rounded-md border transition-colors focus-ring', checked ? 'border-transparent bg-brand text-[#14161C]' : 'border-line-strong bg-surface hover:border-brand')}>
      {checked && <Check className="h-3 w-3" strokeWidth={3} />}
    </button>
  );
}

function ActionsMenu<T>({ actions, row }: { actions: RowAction<T>[]; row: T }) {
  if (!actions.length) return null;
  return (
    <Dropdown>
      <DropdownTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label="Acciones"><MoreHorizontal className="h-4 w-4" /></Button>
      </DropdownTrigger>
      <DropdownContent>
        {actions.map((a) => (
          <DropdownItem key={a.label} danger={a.danger} onSelect={() => a.onClick(row)}>
            {a.icon}{a.label}
          </DropdownItem>
        ))}
      </DropdownContent>
    </Dropdown>
  );
}
