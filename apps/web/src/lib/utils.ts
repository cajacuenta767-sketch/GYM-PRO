import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));

export const initials = (name?: string | null, last?: string | null) => {
  const parts = [name, last].filter(Boolean).join(' ').trim().split(/\s+/);
  return parts.slice(0, 2).map((p) => p[0]?.toUpperCase() ?? '').join('') || '?';
};

export const fullName = (p?: { firstName?: string; lastName?: string; name?: string } | null) =>
  p ? (p.name ?? `${p.firstName ?? ''} ${p.lastName ?? ''}`.trim()) : '—';

export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Color de avatar estable derivado de un texto. */
export const hashHue = (s: string) => {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 360;
  return h;
};
