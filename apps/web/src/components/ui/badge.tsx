import { cn } from '@/lib/utils';
import type { Tone } from '@/lib/labels';

const tones: Record<Tone, string> = {
  brand: 'bg-brand-soft text-brand-ink',
  success: 'bg-success-soft text-success-ink',
  warning: 'bg-warning-soft text-warning-ink',
  danger: 'bg-danger-soft text-danger-ink',
  info: 'bg-info-soft text-info-ink',
  neutral: 'bg-surface-3 text-ink-2',
};

export function Badge({ tone = 'neutral', children, className, dot }: { tone?: Tone; children: React.ReactNode; className?: string; dot?: boolean }) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11.5px] font-semibold whitespace-nowrap', tones[tone], className)}>
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" />}
      {children}
    </span>
  );
}

export function StatusBadge({ value, map }: { value?: string | null; map: Record<string, { label: string; tone: Tone }> }) {
  const entry = value ? map[value] : undefined;
  return <Badge tone={entry?.tone ?? 'neutral'} dot>{entry?.label ?? value ?? '—'}</Badge>;
}

/** Punto de color (para planes, clases, grupos). */
export function ColorDot({ color, className }: { color?: string; className?: string }) {
  return <span className={cn('inline-block h-2.5 w-2.5 rounded-full shrink-0', className)} style={{ background: color ?? '#94A3B8' }} />;
}
