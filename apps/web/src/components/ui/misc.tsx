import { Search, Inbox } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from './input';
import { Button } from './button';

export function PageHeader({ title, description, actions, eyebrow, className }: { title: React.ReactNode; description?: React.ReactNode; actions?: React.ReactNode; eyebrow?: React.ReactNode; className?: string }) {
  return (
    <div className={cn('flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between mb-6', className)}>
      <div className="min-w-0">
        {eyebrow && <p className="mb-1 text-[12px] font-semibold uppercase tracking-[0.08em] text-ink-3">{eyebrow}</p>}
        <h1 className="text-[26px] font-bold leading-tight text-ink">{title}</h1>
        {description && <p className="mt-1 text-[13.5px] text-ink-2 max-w-2xl">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2 shrink-0">{actions}</div>}
    </div>
  );
}

export function SearchInput({ value, onChange, placeholder = 'Buscar…', className }: { value: string; onChange: (v: string) => void; placeholder?: string; className?: string }) {
  return (
    <div className={cn('relative', className)}>
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-3" />
      <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="pl-9" />
    </div>
  );
}

export function EmptyState({ icon, title, description, action, className }: { icon?: React.ReactNode; title: string; description?: string; action?: React.ReactNode; className?: string }) {
  return (
    <div className={cn('flex flex-col items-center justify-center text-center py-14 px-6', className)}>
      <span className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-2 text-ink-3 [&_svg]:h-6 [&_svg]:w-6">{icon ?? <Inbox />}</span>
      <h3 className="font-display text-[15px] font-semibold text-ink">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-[13px] text-ink-2">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('skeleton h-4 w-full', className)} />;
}

export function ProgressBar({ value, color, className, size = 'md' }: { value: number; color?: string; className?: string; size?: 'sm' | 'md' }) {
  return (
    <div className={cn('w-full rounded-full bg-surface-3 overflow-hidden', size === 'sm' ? 'h-1.5' : 'h-2', className)}>
      <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(100, Math.max(0, value))}%`, background: color ?? '#C3F13D' }} />
    </div>
  );
}

export function Pagination({ page, pages, total, limit, onPage, onLimit }: { page: number; pages: number; total: number; limit: number; onPage: (p: number) => void; onLimit?: (l: number) => void }) {
  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(total, page * limit);
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between text-[12.5px] text-ink-2">
      <div className="flex items-center gap-3">
        <span>Mostrando <b className="text-ink">{from}–{to}</b> de <b className="text-ink">{total}</b></span>
        {onLimit && (
          <select value={limit} onChange={(e) => onLimit(Number(e.target.value))} className="h-8 rounded-lg border border-line bg-surface px-2 text-[12.5px] focus-ring">
            {[10, 20, 50, 100].map((n) => <option key={n} value={n}>{n} / pág.</option>)}
          </select>
        )}
      </div>
      <div className="flex items-center gap-1">
        <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => onPage(page - 1)}>Anterior</Button>
        {pageWindow(page, pages).map((p, i) =>
          p === '…' ? <span key={`e${i}`} className="px-1.5">…</span> : (
            <Button key={p} variant={p === page ? 'dark' : 'ghost'} size="sm" className="min-w-8" onClick={() => onPage(p as number)}>{p}</Button>
          ),
        )}
        <Button variant="outline" size="sm" disabled={page >= pages} onClick={() => onPage(page + 1)}>Siguiente</Button>
      </div>
    </div>
  );
}

function pageWindow(page: number, pages: number): (number | '…')[] {
  if (pages <= 7) return Array.from({ length: pages }, (_, i) => i + 1);
  const set = new Set<number>([1, pages, page, page - 1, page + 1]);
  const arr = [...set].filter((p) => p >= 1 && p <= pages).sort((a, b) => a - b);
  const out: (number | '…')[] = [];
  arr.forEach((p, i) => { if (i > 0 && p - (arr[i - 1] as number) > 1) out.push('…'); out.push(p); });
  return out;
}

export function Kbd({ children }: { children: React.ReactNode }) {
  return <kbd className="inline-flex h-5 items-center rounded-md border border-line bg-surface-2 px-1.5 font-sans text-[10.5px] font-semibold text-ink-3">{children}</kbd>;
}

export function InfoRow({ label, value, icon }: { label: string; value: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-line last:border-0">
      {icon && <span className="mt-0.5 text-ink-3 [&_svg]:h-4 [&_svg]:w-4">{icon}</span>}
      <span className="w-36 shrink-0 text-[12.5px] font-medium text-ink-2">{label}</span>
      <span className="min-w-0 flex-1 text-[13.5px] font-medium text-ink break-words">{value ?? '—'}</span>
    </div>
  );
}
