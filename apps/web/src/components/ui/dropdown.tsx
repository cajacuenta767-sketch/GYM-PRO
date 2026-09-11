import * as DM from '@radix-ui/react-dropdown-menu';
import { cn } from '@/lib/utils';

export const Dropdown = DM.Root;
export const DropdownTrigger = DM.Trigger;

export function DropdownContent({ children, align = 'end', className }: { children: React.ReactNode; align?: 'start' | 'end' | 'center'; className?: string }) {
  return (
    <DM.Portal>
      <DM.Content align={align} sideOffset={6} className={cn('z-50 min-w-[180px] rounded-xl border border-line bg-surface p-1.5 shadow-pop animate-scale-in', className)}>
        {children}
      </DM.Content>
    </DM.Portal>
  );
}

export function DropdownItem({ children, onSelect, danger, className, disabled }: { children: React.ReactNode; onSelect?: () => void; danger?: boolean; className?: string; disabled?: boolean }) {
  return (
    <DM.Item
      disabled={disabled}
      onSelect={onSelect}
      className={cn('flex cursor-pointer select-none items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] outline-none transition-colors [&_svg]:h-4 [&_svg]:w-4 data-[disabled]:opacity-50',
        danger ? 'text-danger-ink hover:bg-danger-soft focus:bg-danger-soft' : 'text-ink hover:bg-surface-2 focus:bg-surface-2', className)}
    >
      {children}
    </DM.Item>
  );
}

export function DropdownSeparator() { return <DM.Separator className="my-1.5 h-px bg-line" />; }
export function DropdownLabel({ children }: { children: React.ReactNode }) { return <DM.Label className="px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-ink-3">{children}</DM.Label>; }
