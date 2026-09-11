import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './button';

type Size = 'sm' | 'md' | 'lg' | 'xl';
const sizes: Record<Size, string> = { sm: 'max-w-md', md: 'max-w-xl', lg: 'max-w-3xl', xl: 'max-w-5xl' };

export function Dialog({ open, onOpenChange, title, description, children, footer, size = 'md', className }: {
  open: boolean; onOpenChange: (o: boolean) => void; title: React.ReactNode; description?: React.ReactNode; children: React.ReactNode;
  footer?: React.ReactNode; size?: Size; className?: string;
}) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-side/60 backdrop-blur-[2px] animate-fade-in" />
        <DialogPrimitive.Content
          className={cn('fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-surface shadow-pop border border-line animate-scale-in focus:outline-none flex flex-col max-h-[calc(100vh-2rem)]', sizes[size], className)}
        >
          <div className="flex items-start justify-between gap-4 px-6 pt-5 pb-4 border-b border-line">
            <div>
              <DialogPrimitive.Title className="font-display text-[17px] font-semibold text-ink">{title}</DialogPrimitive.Title>
              {description && <DialogPrimitive.Description className="mt-1 text-[13px] text-ink-2">{description}</DialogPrimitive.Description>}
            </div>
            <DialogPrimitive.Close asChild>
              <Button variant="ghost" size="icon-sm" aria-label="Cerrar"><X className="h-4 w-4" /></Button>
            </DialogPrimitive.Close>
          </div>
          <div className="px-6 py-5 overflow-y-auto scrollbar-thin">{children}</div>
          {footer && <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-line bg-surface-2/60 rounded-b-2xl">{footer}</div>}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

/** Panel lateral deslizante (para detalles y formularios largos). */
export function Drawer({ open, onOpenChange, title, description, children, footer, width = 'max-w-lg' }: {
  open: boolean; onOpenChange: (o: boolean) => void; title: React.ReactNode; description?: React.ReactNode; children: React.ReactNode; footer?: React.ReactNode; width?: string;
}) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-side/60 backdrop-blur-[2px] animate-fade-in" />
        <DialogPrimitive.Content className={cn('fixed right-0 top-0 z-50 h-full w-full bg-surface shadow-pop border-l border-line animate-slide-in-right focus:outline-none flex flex-col', width)}>
          <div className="flex items-start justify-between gap-4 px-6 pt-5 pb-4 border-b border-line">
            <div>
              <DialogPrimitive.Title className="font-display text-[17px] font-semibold text-ink">{title}</DialogPrimitive.Title>
              {description && <DialogPrimitive.Description className="mt-1 text-[13px] text-ink-2">{description}</DialogPrimitive.Description>}
            </div>
            <DialogPrimitive.Close asChild>
              <Button variant="ghost" size="icon-sm" aria-label="Cerrar"><X className="h-4 w-4" /></Button>
            </DialogPrimitive.Close>
          </div>
          <div className="flex-1 overflow-y-auto px-6 py-5 scrollbar-thin">{children}</div>
          {footer && <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-line bg-surface-2/60">{footer}</div>}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

export function ConfirmDialog({ open, onOpenChange, title = '¿Confirmar acción?', description, confirmLabel = 'Eliminar', onConfirm, loading, danger = true }: {
  open: boolean; onOpenChange: (o: boolean) => void; title?: string; description?: React.ReactNode; confirmLabel?: string; onConfirm: () => void; loading?: boolean; danger?: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange} title={title} size="sm"
      footer={<>
        <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
        <Button variant={danger ? 'danger' : 'primary'} onClick={onConfirm} loading={loading}>{confirmLabel}</Button>
      </>}
    >
      <p className="text-[13.5px] text-ink-2">{description ?? 'Esta acción no se puede deshacer.'}</p>
    </Dialog>
  );
}
