import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

export function StatCard({ label, value, hint, trend, icon, tone = 'neutral', className, onClick }: {
  label: string; value: React.ReactNode; hint?: React.ReactNode; trend?: number | null; icon?: React.ReactNode;
  tone?: 'brand' | 'info' | 'warning' | 'success' | 'danger' | 'neutral' | 'violet'; className?: string; onClick?: () => void;
}) {
  const iconTone = {
    brand: 'bg-brand text-[#14161C]', info: 'bg-info-soft text-info-ink', warning: 'bg-warning-soft text-warning-ink',
    success: 'bg-success-soft text-success-ink', danger: 'bg-danger-soft text-danger-ink', neutral: 'bg-surface-3 text-ink-2',
    violet: 'bg-[#EDE9FE] text-[#6D28D9] dark:bg-[#2E2652] dark:text-[#C4B5FD]',
  }[tone];
  const Comp = onClick ? 'button' : 'div';
  return (
    <Comp onClick={onClick} className={cn('card p-5 flex items-start gap-4 text-left w-full', onClick && 'transition-shadow hover:shadow-pop', className)}>
      {icon && <span className={cn('inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl [&_svg]:h-5 [&_svg]:w-5', iconTone)}>{icon}</span>}
      <div className="min-w-0 flex-1">
        <p className="text-[12.5px] font-medium text-ink-2 truncate">{label}</p>
        <p className="kpi-number mt-1 text-[26px] leading-none text-ink">{value}</p>
        {(hint || trend !== undefined) && (
          <div className="mt-2 flex items-center gap-2 text-[12px]">
            {trend !== undefined && trend !== null && <Trend value={trend} />}
            {hint && <span className="text-ink-3 truncate">{hint}</span>}
          </div>
        )}
      </div>
    </Comp>
  );
}

export function Trend({ value }: { value: number }) {
  const up = value > 0, flat = value === 0;
  return (
    <span className={cn('inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 font-semibold', flat ? 'bg-surface-3 text-ink-2' : up ? 'bg-success-soft text-success-ink' : 'bg-danger-soft text-danger-ink')}>
      {flat ? <Minus className="h-3 w-3" /> : up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
      {Math.abs(value)}%
    </span>
  );
}
