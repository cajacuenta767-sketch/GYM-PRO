import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { ArrowRight, Search, User } from 'lucide-react';
import { list } from '@/lib/api';
import { cn } from '@/lib/utils';
import { NAV } from '@/app/nav';
import { useDebounce } from '@/hooks/use-debounce';
import { Avatar, Badge, Kbd } from '@/components/ui';
import { MEMBER_STATUS } from '@/lib/labels';

export function CommandPalette({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const [cursor, setCursor] = useState(0);
  const term = useDebounce(q, 200);

  useEffect(() => { if (!open) { setQ(''); setCursor(0); } }, [open]);

  const pages = useMemo(() => {
    const flat = NAV.flatMap((s) => s.items.flatMap((i) => (i.children ? i.children.map((c) => ({ label: c.label, to: c.to, section: s.title })) : [{ label: i.label, to: i.to, section: s.title }])));
    if (!q) return flat.slice(0, 6);
    return flat.filter((p) => p.label.toLowerCase().includes(q.toLowerCase())).slice(0, 5);
  }, [q]);

  const { data: members } = useQuery({
    queryKey: ['palette', 'members', term],
    queryFn: () => list<any>('/members', { search: term, limit: 5 }).then((r) => r.data),
    enabled: open && term.length >= 2,
  });

  const items = [
    ...pages.map((p) => ({ kind: 'page' as const, key: p.to, label: p.label, hint: p.section, to: p.to })),
    ...(members ?? []).map((m) => ({ kind: 'member' as const, key: m.id, label: `${m.firstName} ${m.lastName}`, hint: m.code, to: `/miembros/${m.id}`, member: m })),
  ];

  useEffect(() => { setCursor(0); }, [items.length, term]);

  const go = (to: string) => { onOpenChange(false); navigate(to); };
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setCursor((c) => Math.min(items.length - 1, c + 1)); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setCursor((c) => Math.max(0, c - 1)); }
    if (e.key === 'Enter' && items[cursor]) go(items[cursor].to);
  };

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-side/60 backdrop-blur-[2px] animate-fade-in" />
        <DialogPrimitive.Content className="fixed left-1/2 top-[12vh] z-50 w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 rounded-2xl border border-line bg-surface shadow-pop animate-scale-in focus:outline-none overflow-hidden">
          <DialogPrimitive.Title className="sr-only">Buscar</DialogPrimitive.Title>
          <div className="flex items-center gap-3 border-b border-line px-4">
            <Search className="h-4 w-4 text-ink-3" />
            <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={onKey} placeholder="Buscar páginas o miembros…" className="h-12 flex-1 bg-transparent text-[14px] text-ink placeholder:text-ink-3 outline-none" />
            <Kbd>Esc</Kbd>
          </div>
          <div className="max-h-[50vh] overflow-y-auto p-2 scrollbar-thin">
            {items.length === 0 && <p className="px-3 py-8 text-center text-[13px] text-ink-3">Sin resultados para “{q}”.</p>}
            {items.map((it, i) => (
              <button key={it.key} onMouseEnter={() => setCursor(i)} onClick={() => go(it.to)}
                className={cn('flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors', i === cursor ? 'bg-surface-2' : '')}>
                {it.kind === 'member' ? <Avatar name={it.label} src={it.member.photoUrl} size="sm" /> : <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-surface-3 text-ink-2"><ArrowRight className="h-4 w-4" /></span>}
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13.5px] font-medium text-ink">{it.label}</span>
                  <span className="block text-[11.5px] text-ink-3">{it.kind === 'member' ? `Miembro · ${it.hint}` : it.hint}</span>
                </span>
                {it.kind === 'member' && <Badge tone={MEMBER_STATUS[it.member.status]?.tone}>{MEMBER_STATUS[it.member.status]?.label}</Badge>}
                {it.kind === 'page' && <span className="text-[11px] text-ink-3">Ir</span>}
              </button>
            ))}
            {q.length >= 2 && !members?.length && <p className="px-3 pt-1 pb-2 text-[11.5px] text-ink-3 flex items-center gap-1.5"><User className="h-3 w-3" /> Escribe el nombre o código de un miembro.</p>}
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
