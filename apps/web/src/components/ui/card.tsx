import { cn } from '@/lib/utils';

export function Card({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('card', className)} {...props}>{children}</div>;
}

export function CardHeader({ title, description, action, className, icon }: { title: React.ReactNode; description?: React.ReactNode; action?: React.ReactNode; className?: string; icon?: React.ReactNode }) {
  return (
    <div className={cn('flex items-start justify-between gap-4 px-5 pt-5 pb-3', className)}>
      <div className="flex items-start gap-3 min-w-0">
        {icon && <span className="mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-lg bg-surface-2 text-ink-2 [&_svg]:h-4 [&_svg]:w-4">{icon}</span>}
        <div className="min-w-0">
          <h3 className="font-display text-[15px] font-semibold text-ink leading-tight">{title}</h3>
          {description && <p className="mt-0.5 text-[12.5px] text-ink-2">{description}</p>}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function CardBody({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn('px-5 pb-5', className)}>{children}</div>;
}
