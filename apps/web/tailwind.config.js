/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"DM Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['Sora', '"DM Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        // Tokens semánticos (se resuelven en globals.css para tema claro/oscuro)
        bg: 'rgb(var(--bg) / <alpha-value>)',
        surface: 'rgb(var(--surface) / <alpha-value>)',
        'surface-2': 'rgb(var(--surface-2) / <alpha-value>)',
        'surface-3': 'rgb(var(--surface-3) / <alpha-value>)',
        line: 'rgb(var(--line) / <alpha-value>)',
        'line-strong': 'rgb(var(--line-strong) / <alpha-value>)',
        ink: 'rgb(var(--ink) / <alpha-value>)',
        'ink-2': 'rgb(var(--ink-2) / <alpha-value>)',
        'ink-3': 'rgb(var(--ink-3) / <alpha-value>)',
        side: 'rgb(var(--side) / <alpha-value>)',
        'side-2': 'rgb(var(--side-2) / <alpha-value>)',
        'side-ink': 'rgb(var(--side-ink) / <alpha-value>)',
        'side-ink-2': 'rgb(var(--side-ink-2) / <alpha-value>)',
        brand: {
          DEFAULT: '#C3F13D',
          hover: '#B1E12A',
          soft: 'rgb(var(--brand-soft) / <alpha-value>)',
          ink: 'rgb(var(--brand-ink) / <alpha-value>)',
        },
        success: { DEFAULT: '#16A34A', soft: 'rgb(var(--success-soft) / <alpha-value>)', ink: 'rgb(var(--success-ink) / <alpha-value>)' },
        warning: { DEFAULT: '#D97706', soft: 'rgb(var(--warning-soft) / <alpha-value>)', ink: 'rgb(var(--warning-ink) / <alpha-value>)' },
        danger: { DEFAULT: '#DC2626', soft: 'rgb(var(--danger-soft) / <alpha-value>)', ink: 'rgb(var(--danger-ink) / <alpha-value>)' },
        info: { DEFAULT: '#2563EB', soft: 'rgb(var(--info-soft) / <alpha-value>)', ink: 'rgb(var(--info-ink) / <alpha-value>)' },
      },
      borderRadius: { xl: '14px', '2xl': '18px', '3xl': '24px' },
      boxShadow: {
        card: '0 1px 2px rgb(20 22 28 / 0.04), 0 1px 3px rgb(20 22 28 / 0.06)',
        pop: '0 12px 32px -8px rgb(20 22 28 / 0.22), 0 2px 6px rgb(20 22 28 / 0.08)',
        glow: '0 0 0 4px rgb(195 241 61 / 0.25)',
      },
      keyframes: {
        'fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
        'slide-up': { from: { opacity: '0', transform: 'translateY(8px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        'slide-in-right': { from: { transform: 'translateX(100%)' }, to: { transform: 'translateX(0)' } },
        'scale-in': { from: { opacity: '0', transform: 'scale(0.96)' }, to: { opacity: '1', transform: 'scale(1)' } },
        shimmer: { '100%': { transform: 'translateX(100%)' } },
      },
      animation: {
        'fade-in': 'fade-in 160ms ease-out',
        'slide-up': 'slide-up 220ms cubic-bezier(.2,.8,.2,1)',
        'slide-in-right': 'slide-in-right 260ms cubic-bezier(.2,.8,.2,1)',
        'scale-in': 'scale-in 160ms cubic-bezier(.2,.8,.2,1)',
        shimmer: 'shimmer 1.6s infinite',
      },
    },
  },
  plugins: [],
};
