import { useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Bell, LogOut, Moon, MoreHorizontal, Sun, User } from 'lucide-react';
import { get, post } from '@/lib/api';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth.store';
import { applyTheme, useUiStore } from '@/stores/ui.store';
import { Avatar, Button, Dropdown, DropdownContent, DropdownItem, DropdownLabel, DropdownSeparator, DropdownTrigger } from '@/components/ui';
import { Logo } from '@/components/layout/sidebar';
import { PORTAL_NAV } from './portal-nav';

const MOBILE_TABS = PORTAL_NAV.slice(0, 4);

export function PortalShell() {
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const theme = useUiStore((s) => s.theme);
  const setTheme = useUiStore((s) => s.setTheme);
  useEffect(() => { applyTheme(theme); }, [theme]);
  const { data: unread } = useQuery({ queryKey: ['notifications', 'unread-count'], queryFn: () => get<{ count: number }>('/notifications/unread-count'), refetchInterval: 60_000 });
  const logout = () => { post('/auth/logout', { refreshToken: useAuthStore.getState().refreshToken }).catch(() => null).finally(() => useAuthStore.getState().logout()); };
  const isDark = document.documentElement.classList.contains('dark');

  return (
    <div className="min-h-screen bg-bg">
      <header className="sticky top-0 z-30 border-b border-line bg-bg/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4 sm:px-6">
          <Logo className="h-8 w-8" />
          <span className="font-display text-[16px] font-bold tracking-tight">GYM<span className="text-brand-ink">PRO</span> <span className="hidden text-[12px] font-medium text-ink-3 sm:inline">· Portal del miembro</span></span>
          <div className="ml-auto flex items-center gap-1">
            <Button variant="ghost" size="icon" aria-label="Notificaciones" className="relative" onClick={() => navigate('/portal/notificaciones')}>
              <Bell className="h-[18px] w-[18px]" />
              {!!unread?.count && <span className="absolute right-1.5 top-1.5 min-w-[18px] rounded-full bg-brand px-1 text-center text-[10px] font-bold text-[#14161C] ring-2 ring-bg">{unread.count}</span>}
            </Button>
            <Button variant="ghost" size="icon" aria-label="Tema" onClick={() => setTheme(isDark ? 'light' : 'dark')}>{isDark ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}</Button>
            <Dropdown>
              <DropdownTrigger asChild>
                <button className="flex items-center gap-2 rounded-xl p-1 pr-2 hover:bg-surface-2 focus-ring"><Avatar name={user?.name} src={user?.avatarUrl} size="sm" /><span className="hidden text-[13px] font-semibold sm:block">{user?.name.split(' ')[0]}</span></button>
              </DropdownTrigger>
              <DropdownContent className="w-52">
                <DropdownLabel>{user?.email}</DropdownLabel>
                <DropdownItem onSelect={() => navigate('/portal/perfil')}><User />Mi perfil</DropdownItem>
                <DropdownSeparator />
                <DropdownItem danger onSelect={logout}><LogOut />Cerrar sesión</DropdownItem>
              </DropdownContent>
            </Dropdown>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-6 pb-24 sm:px-6 md:grid-cols-[200px_1fr] md:pb-10">
        <nav className="hidden md:block">
          <ul className="sticky top-24 space-y-1">
            {PORTAL_NAV.map((n) => (
              <li key={n.to}><NavLink to={n.to} end={n.end} className={({ isActive }) => cn('flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13.5px] font-medium transition-colors', isActive ? 'bg-side text-side-ink dark:bg-brand dark:text-[#14161C]' : 'text-ink-2 hover:bg-surface-2 hover:text-ink')}><n.icon className="h-[18px] w-[18px]" />{n.label}</NavLink></li>
            ))}
          </ul>
        </nav>
        <main className="min-w-0"><Outlet /></main>
      </div>

      {/* Barra inferior móvil */}
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/95 backdrop-blur-md md:hidden" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <ul className="grid grid-cols-5">
          {MOBILE_TABS.map((n) => (
            <li key={n.to}><NavLink to={n.to} end={n.end} className={({ isActive }) => cn('flex flex-col items-center gap-1 py-2.5 text-[10.5px] font-semibold', isActive ? 'text-brand-ink' : 'text-ink-3')}><n.icon className="h-5 w-5" />{n.label}</NavLink></li>
          ))}
          <li>
            <Dropdown>
              <DropdownTrigger asChild><button className="flex w-full flex-col items-center gap-1 py-2.5 text-[10.5px] font-semibold text-ink-3"><MoreHorizontal className="h-5 w-5" />Más</button></DropdownTrigger>
              <DropdownContent align="end" className="mb-2">
                {PORTAL_NAV.slice(4).map((n) => <DropdownItem key={n.to} onSelect={() => navigate(n.to)}><n.icon />{n.label}</DropdownItem>)}
                <DropdownItem onSelect={() => navigate('/portal/perfil')}><User />Mi perfil</DropdownItem>
              </DropdownContent>
            </Dropdown>
          </li>
        </ul>
      </nav>
    </div>
  );
}
