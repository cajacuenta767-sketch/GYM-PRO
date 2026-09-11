import { useState } from 'react';
import { cn, hashHue, initials } from '@/lib/utils';

type Size = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
const sizes: Record<Size, string> = { xs: 'h-6 w-6 text-[10px]', sm: 'h-8 w-8 text-[11px]', md: 'h-9 w-9 text-[12px]', lg: 'h-11 w-11 text-[13px]', xl: 'h-16 w-16 text-[18px]', '2xl': 'h-24 w-24 text-[26px]' };

export function Avatar({ src, name, size = 'md', className, square }: { src?: string | null; name?: string; size?: Size; className?: string; square?: boolean }) {
  const [failed, setFailed] = useState(false);
  const label = name ?? '';
  const hue = hashHue(label || 'x');
  const showImg = src && !failed;
  return (
    <span
      className={cn('relative inline-flex shrink-0 items-center justify-center overflow-hidden font-display font-semibold text-white select-none', square ? 'rounded-xl' : 'rounded-full', sizes[size], className)}
      style={showImg ? undefined : { background: `oklch(62% 0.13 ${hue})` }}
      aria-label={label}
    >
      {showImg ? <img src={src!} alt={label} className="h-full w-full object-cover" onError={() => setFailed(true)} loading="lazy" /> : initials(label)}
    </span>
  );
}

export function AvatarGroup({ people, max = 4, size = 'sm' }: { people: { name: string; src?: string | null }[]; max?: number; size?: Size }) {
  const shown = people.slice(0, max);
  const rest = people.length - shown.length;
  return (
    <div className="flex -space-x-2">
      {shown.map((p, i) => <Avatar key={i} name={p.name} src={p.src} size={size} className="ring-2 ring-surface" />)}
      {rest > 0 && <span className={cn('inline-flex items-center justify-center rounded-full bg-surface-3 text-ink-2 font-semibold ring-2 ring-surface', sizes[size])}>+{rest}</span>}
    </div>
  );
}
