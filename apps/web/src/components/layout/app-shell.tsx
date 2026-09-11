import { Outlet } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useUiStore } from '@/stores/ui.store';
import { Sidebar } from './sidebar';
import { Topbar } from './topbar';

export function AppShell() {
  const collapsed = useUiStore((s) => s.sidebarCollapsed);
  return (
    <div className="min-h-screen bg-bg">
      <Sidebar />
      <div className={cn('flex min-h-screen flex-col transition-[padding] duration-200', collapsed ? 'lg:pl-[76px]' : 'lg:pl-[264px]')}>
        <Topbar />
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 max-w-[1500px] w-full mx-auto">
          <Outlet />
        </main>
        <footer className="px-6 py-4 text-[11.5px] text-ink-3 border-t border-line">GYM PRO · Sistema de gestión de gimnasios · v1.0</footer>
      </div>
    </div>
  );
}
