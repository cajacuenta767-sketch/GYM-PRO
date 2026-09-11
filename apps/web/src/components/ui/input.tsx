import { forwardRef, type InputHTMLAttributes, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

const base =
  'w-full h-[38px] rounded-xl border border-line bg-surface px-3 text-[13.5px] text-ink placeholder:text-ink-3 transition-colors focus-ring hover:border-line-strong disabled:opacity-60 disabled:bg-surface-2';

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }>(
  ({ className, invalid, ...props }, ref) => (
    <input ref={ref} className={cn(base, invalid && 'border-danger focus-visible:ring-danger/20 focus-visible:border-danger', className)} {...props} />
  ),
);
Input.displayName = 'Input';

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean }>(
  ({ className, invalid, ...props }, ref) => (
    <textarea ref={ref} className={cn(base, 'h-auto min-h-[96px] py-2.5 leading-relaxed resize-y', invalid && 'border-danger', className)} {...props} />
  ),
);
Textarea.displayName = 'Textarea';

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement> & { invalid?: boolean }>(
  ({ className, invalid, children, ...props }, ref) => (
    <div className="relative">
      <select ref={ref} className={cn(base, 'appearance-none pr-9 cursor-pointer', invalid && 'border-danger', className)} {...props}>
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-3" />
    </div>
  ),
);
Select.displayName = 'Select';

export function Label({ children, required, className }: { children: React.ReactNode; required?: boolean; className?: string }) {
  return (
    <label className={cn('block text-[12.5px] font-semibold text-ink-2 mb-1.5', className)}>
      {children}
      {required && <span className="text-danger ml-0.5">*</span>}
    </label>
  );
}

export function FieldError({ children }: { children?: React.ReactNode }) {
  if (!children) return null;
  return <p className="mt-1 text-[12px] text-danger-ink">{children}</p>;
}

export function Hint({ children }: { children?: React.ReactNode }) {
  if (!children) return null;
  return <p className="mt-1 text-[12px] text-ink-3">{children}</p>;
}
