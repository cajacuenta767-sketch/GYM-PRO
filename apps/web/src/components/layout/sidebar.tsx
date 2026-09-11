import { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { ChevronDown, ChevronsLeft, X } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { get } from '@/lib/api';
import { NAV, type NavItem } from '@/app/nav';
import { useUiStore } from '@/stores/ui.store';
import { useAuthStore } from '@/stores/auth.store';
import { Tooltip } from '@/components/ui';

export function Sidebar() {
  const collapsed = useUiStore((s) => s.sidebarCollapsed);
  const toggle = useUiStore((s) => s.toggleSidebar);
  const mobileOpen = useUiStore((s) => s.mobileNavOpen);
  const setMobile = useUiStore((s) => s.setMobileNav);
  const location = useLocation();

  useEffect(() => { setMobile(false); }, [location.pathname, setMobile]);

  const content = (
    <div className="flex h-full flex-col">
      {/* Marca */}
      <div className={cn('flex h-16 items-center gap-3 px-4', collapsed && 'justify-center px-0')}>
        <Logo />
        {!collapsed && (
          <div className="leading-none">
            <p className="font-display text-[17px] font-bold tracking-tight text-side-ink">GYM<span className="text-brand">PRO</span></p>
            <p className="mt-1 text-[10.5px] font-medium uppercase tracking-[0.14em] text-side-ink-2">Gestión</p>
          </div>
        )}
        <button onClick={() => setMobile(false)} className="ml-auto rounded-lg p-1.5 text-side-ink-2 hover:bg-white/10 lg:hidden" aria-label="Cerrar menú"><X className="h-5 w-5" /></button>
      </div>

      {/* Navegación */}
      <nav className="flex-1 overflow-y-auto px-3 pb-4 scrollbar-thin">
        {NAV.map((section) => (
          <div key={section.title} className="mt-4 first:mt-1">
            {!collapsed && <p className="mb-1.5 px-3 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-side-ink-2/80">{section.title}</p>}
            <ul className="space-y-0.5">
              {section.items.map((item) => <NavEntry key={item.to} item={item} collapsed={collapsed} />)}
            </ul>
          </div>
        ))}
      </nav>

      {/* Pie */}
      <div className="border-t border-white/[0.06] p-3 hidden lg:block">
        <button onClick={toggle} className={cn('nav-item w-full', collapsed && 'justify-center px-0')} aria-label="Contraer menú">
          <ChevronsLeft className={cn('h-4 w-4 transition-transform', collapsed && 'rotate-180')} />
          {!collapsed && <span>Contraer menú</span>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Escritorio */}
      <aside className={cn('fixed inset-y-0 left-0 z-40 hidden bg-side transition-[width] duration-200 lg:block', collapsed ? 'w-[76px]' : 'w-[264px]')}>{content}</aside>
      {/* Móvil */}
      {mobileOpen && <div className="fixed inset-0 z-40 bg-side/70 backdrop-blur-[2px] lg:hidden animate-fade-in" onClick={() => setMobile(false)} />}
      <aside className={cn('fixed inset-y-0 left-0 z-50 w-[280px] bg-side transition-transform duration-250 lg:hidden', mobileOpen ? 'translate-x-0' : '-translate-x-full')}>{content}</aside>
    </>
  );
}

function NavEntry({ item, collapsed }: { item: NavItem; collapsed: boolean }) {
  const location = useLocation();
  const can = useAuthStore((s) => s.can);
  const isActive = item.to === '/' ? location.pathname === '/' : location.pathname === item.to || item.children?.some((c) => location.pathname === c.to || location.pathname.startsWith(c.to + '/')) || location.pathname.startsWith(item.to + '/');
  const [open, setOpen] = useState(!!isActive);
  useEffect(() => { if (isActive) setOpen(true); }, [isActive]);

  const { data: unread } = useQuery({ queryKey: ['messages', 'unread-count'], queryFn: () => get<{ count: number }>('/messages/unread-count'), enabled: item.badge === 'messages', refetchInterval: 60_000 });
  if (item.permission && !can(item.permission)) return null;
  const Icon = item.icon;

  if (collapsed) {
    return (
      <li>
        <Tooltip content={item.label} side="right">
          <NavLink to={item.to} end={item.to === '/'} className="nav-item justify-center px-0 relative" data-active={isActive}>
            <Icon className="nav-icon h-[18px] w-[18px]" />
            {item.badge === 'messages' && !!unread?.count && <span className="absolute right-3 top-2 h-2 w-2 rounded-full bg-brand" />}
          </NavLink>
        </Tooltip>
      </li>
    );
  }

  if (item.children) {
    return (
      <li>
        <button onClick={() => setOpen((o) => !o)} className="nav-item w-full" data-active={isActive && !open}>
          <Icon className="nav-icon h-[18px] w-[18px]" />
          <span className="flex-1 text-left truncate">{item.label}</span>
          <ChevronDown className={cn('h-4 w-4 transition-transform text-side-ink-2', open && 'rotate-180')} />
        </button>
        {open && (
          <ul className="mt-0.5 mb-1 ml-[22px] space-y-0.5 border-l border-white/[0.08] pl-3">
            {item.children.map((c) => (
              <li key={c.to}>
                <NavLink to={c.to} end className={({ isActive: a }) => cn('block rounded-lg px-3 py-1.5 text-[13px] text-side-ink-2 transition-colors hover:text-side-ink', a && 'text-brand font-medium')}>{c.label}</NavLink>
              </li>
            ))}
          </ul>
        )}
      </li>
    );
  }

  return (
    <li>
      <NavLink to={item.to} end={item.to === '/'} className="nav-item" data-active={isActive}>
        <Icon className="nav-icon h-[18px] w-[18px]" />
        <span className="flex-1 truncate">{item.label}</span>
        {item.badge === 'messages' && !!unread?.count && <span className="rounded-md bg-brand px-1.5 text-[11px] font-bold text-[#14161C]">{unread.count}</span>}
      </NavLink>
    </li>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn('inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand', className)}>
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="#14161C" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 8v8M18 8v8M3 10v4M21 10v4M6 12h12" />
      </svg>
    </span>
  );
}
