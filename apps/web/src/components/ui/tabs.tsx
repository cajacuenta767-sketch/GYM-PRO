import * as TabsPrimitive from '@radix-ui/react-tabs';
import { cn } from '@/lib/utils';

export const Tabs = TabsPrimitive.Root;
export const TabsContent = TabsPrimitive.Content;

export function TabsList({ children, className }: { children: React.ReactNode; className?: string }) {
  return <TabsPrimitive.List className={cn('inline-flex items-center gap-1 rounded-xl bg-surface-2 p-1 border border-line', className)}>{children}</TabsPrimitive.List>;
}

export function TabsTrigger({ value, children, className, count }: { value: string; children: React.ReactNode; className?: string; count?: number }) {
  return (
    <TabsPrimitive.Trigger
      value={value}
      className={cn('inline-flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-[13px] font-medium text-ink-2 transition-all data-[state=active]:bg-surface data-[state=active]:text-ink data-[state=active]:shadow-card hover:text-ink focus-ring whitespace-nowrap', className)}
    >
      {children}
      {count !== undefined && <span className="rounded-md bg-surface-3 px-1.5 text-[11px] font-semibold text-ink-2">{count}</span>}
    </TabsPrimitive.Trigger>
  );
}

/** Tabs subrayadas (para páginas de detalle). */
export function UnderlineTabsList({ children, className }: { children: React.ReactNode; className?: string }) {
  return <TabsPrimitive.List className={cn('flex items-center gap-6 border-b border-line overflow-x-auto scrollbar-thin', className)}>{children}</TabsPrimitive.List>;
}
export function UnderlineTab({ value, children, count }: { value: string; children: React.ReactNode; count?: number }) {
  return (
    <TabsPrimitive.Trigger value={value} className="relative -mb-px inline-flex items-center gap-2 border-b-2 border-transparent pb-3 pt-1 text-[13.5px] font-medium text-ink-2 transition-colors hover:text-ink data-[state=active]:border-brand data-[state=active]:text-ink whitespace-nowrap focus-ring">
      {children}
      {count !== undefined && <span className="rounded-md bg-surface-3 px-1.5 text-[11px] font-semibold text-ink-2">{count}</span>}
    </TabsPrimitive.Trigger>
  );
}
