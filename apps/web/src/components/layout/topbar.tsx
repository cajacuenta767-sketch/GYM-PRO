import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Bell, LogOut, Menu, Moon, QrCode, Search, Settings, Sun, User } from 'lucide-react';
import { get } from '@/lib/api';
import { cn } from '@/lib/utils';
import { NAV } from '@/app/nav';
import { useUiStore, applyTheme } from '@/stores/ui.store';
import { useAuthStore } from '@/stores/auth.store';
import { Avatar, Button, Dropdown, DropdownContent, DropdownItem, DropdownLabel, DropdownSeparator, DropdownTrigger, Kbd } from '@/components/ui';
import { NOTICE_TYPE } from '@/lib/labels';
import { fmtRelative } from '@/lib/format';
import { CommandPalette } from './command-palette';

export function Topbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const setMobile = useUiStore((s) => s.setMobileNav);
  const theme = useUiStore((s) => s.theme);
  const setTheme = useUiStore((s) => s.setTheme);
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const [paletteOpen, setPaletteOpen] = useState(false);

  useEffect(() => { applyTheme(theme); }, [theme]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setPaletteOpen((o) => !o); } };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const { data: notices } = useQuery({ queryKey: ['notices', 'active'], queryFn: () => get<any[]>('/notices/active'), refetchInterval: 120_000 });
  const crumb = findCrumb(location.pathname);
  const isDark = document.documentElement.classList.contains('dark');

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-line bg-bg/85 px-4 backdrop-blur-md sm:px-6">
      <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setMobile(true)} aria-label="Abrir menú"><Menu className="h-5 w-5" /></Button>

      <div className="hidden min-w-0 md:block">
        <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-ink-3">{crumb.section}</p>
        <p className="truncate font-display text-[14px] font-semibold text-ink leading-tight">{crumb.label}</p>
      </div>

      <button onClick={() => setPaletteOpen(true)} className="ml-auto flex h-[38px] w-full max-w-xs items-center gap-2 rounded-xl border border-line bg-surface px-3 text-[13px] text-ink-3 transition-colors hover:border-line-strong focus-ring">
        <Search className="h-4 w-4" />
        <span className="flex-1 text-left">Buscar miembros, clases, pagos…</span>
        <span className="hidden sm:inline-flex gap-1"><Kbd>Ctrl</Kbd><Kbd>K</Kbd></span>
      </button>

      <Button variant="dark" size="md" className="hidden sm:inline-flex" onClick={() => navigate('/asistencia')}>
        <QrCode className="h-4 w-4" /> Check-in
      </Button>

      <Dropdown>
        <DropdownTrigger asChild>
          <Button variant="ghost" size="icon" aria-label="Avisos" className="relative">
            <Bell className="h-[18px] w-[18px]" />
            {!!notices?.length && <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-brand ring-2 ring-bg" />}
          </Button>
        </DropdownTrigger>
        <DropdownContent className="w-80 p-0">
          <div className="flex items-center justify-between px-4 py-3 border-b border-line">
            <p className="font-display text-[13.5px] font-semibold">Avisos activos</p>
            <button onClick={() => navigate('/avisos')} className="text-[12px] font-medium text-brand-ink hover:underline">Ver todos</button>
          </div>
          <div className="max-h-80 overflow-y-auto scrollbar-thin">
            {notices?.length ? notices.map((n) => (
              <div key={n.id} className="px-4 py-3 border-b border-line last:border-0 hover:bg-surface-2">
                <div className="flex items-center gap-2">
                  <span className={cn('h-1.5 w-1.5 rounded-full', { INFO: 'bg-info', WARNING: 'bg-warning', URGENT: 'bg-danger', PROMO: 'bg-brand' }[n.type as string] ?? 'bg-ink-3')} />
                  <p className="text-[13px] font-semibold text-ink truncate">{n.title}</p>
                </div>
                <p className="mt-1 text-[12px] text-ink-2 line-clamp-2">{n.content}</p>
                <p className="mt-1 text-[11px] text-ink-3">{NOTICE_TYPE[n.type]?.label} · {fmtRelative(n.startsAt)}</p>
              </div>
            )) : <p className="px-4 py-6 text-center text-[13px] text-ink-3">No hay avisos activos.</p>}
          </div>
        </DropdownContent>
      </Dropdown>

      <Button variant="ghost" size="icon" aria-label="Cambiar tema" onClick={() => setTheme(isDark ? 'light' : 'dark')}>
        {isDark ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
      </Button>

      <Dropdown>
        <DropdownTrigger asChild>
          <button className="flex items-center gap-2.5 rounded-xl p-1 pr-2 transition-colors hover:bg-surface-2 focus-ring">
            <Avatar name={user?.name} src={user?.avatarUrl} size="sm" />
            <span className="hidden text-left md:block">
              <span className="block text-[13px] font-semibold text-ink leading-tight">{user?.name}</span>
              <span className="block text-[11px] text-ink-3 leading-tight">{user?.roleName ?? user?.role}</span>
            </span>
          </button>
        </DropdownTrigger>
        <DropdownContent className="w-56">
          <DropdownLabel>{user?.email}</DropdownLabel>
          <DropdownItem onSelect={() => navigate('/perfil')}><User />Mi perfil</DropdownItem>
          <DropdownItem onSelect={() => navigate('/configuracion')}><Settings />Configuración</DropdownItem>
          <DropdownSeparator />
          <DropdownItem danger onSelect={logout}><LogOut />Cerrar sesión</DropdownItem>
        </DropdownContent>
      </Dropdown>

      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
    </header>
  );
}

function findCrumb(path: string) {
  const entries = NAV.flatMap((s) => s.items.flatMap((i) => [{ to: i.to, label: i.label, section: s.title }, ...(i.children ?? []).map((c) => ({ to: c.to, label: c.label, section: s.title }))]));
  const exact = entries.find((e) => e.to === path);
  if (exact) return exact;
  const prefix = entries.filter((e) => e.to !== '/' && path.startsWith(e.to + '/')).sort((a, b) => b.to.length - a.to.length)[0];
  if (prefix) return prefix;
  if (path.startsWith('/perfil')) return { section: 'Cuenta', label: 'Mi perfil' };
  return { section: 'GYM PRO', label: 'Panel' };
}
