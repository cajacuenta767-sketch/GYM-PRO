import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline' | 'dark';
type Size = 'sm' | 'md' | 'lg' | 'icon' | 'icon-sm';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

const variants: Record<Variant, string> = {
  primary: 'bg-brand text-[#14161C] hover:bg-brand-hover shadow-[inset_0_-1px_0_rgb(0_0_0/0.08)] font-semibold',
  dark: 'bg-side text-side-ink hover:bg-side-2 font-semibold dark:bg-surface-3 dark:hover:bg-line-strong',
  secondary: 'bg-surface-2 text-ink hover:bg-surface-3 border border-line',
  outline: 'bg-transparent text-ink border border-line-strong hover:bg-surface-2',
  ghost: 'bg-transparent text-ink-2 hover:bg-surface-2 hover:text-ink',
  danger: 'bg-danger text-white hover:bg-red-700 font-semibold',
};

const sizes: Record<Size, string> = {
  sm: 'h-8 px-3 text-[12.5px] rounded-lg gap-1.5',
  md: 'h-9.5 h-[38px] px-3.5 text-[13.5px] rounded-xl gap-2',
  lg: 'h-11 px-5 text-[14px] rounded-xl gap-2',
  icon: 'h-[38px] w-[38px] rounded-xl',
  'icon-sm': 'h-8 w-8 rounded-lg',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, disabled, children, ...props }, ref) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center whitespace-nowrap font-medium transition-all focus-ring active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none [&_svg]:shrink-0',
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : children}
    </button>
  ),
);
Button.displayName = 'Button';
