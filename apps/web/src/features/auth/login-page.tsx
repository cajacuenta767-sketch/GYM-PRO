import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { Eye, EyeOff, Lock, Mail } from 'lucide-react';
import { toast } from 'sonner';
import { post } from '@/lib/api';
import { useAuthStore, type AuthUser } from '@/stores/auth.store';
import { Button, FieldError, Input, Label } from '@/components/ui';
import { Logo } from '@/components/layout/sidebar';

const schema = z.object({ email: z.string().email('Correo no válido'), password: z.string().min(4, 'Mínimo 4 caracteres') });
type Form = z.infer<typeof schema>;

const DEMO = [
  { label: 'Administrador', email: 'admin@gympro.app', password: 'admin123' },
  { label: 'Recepción', email: 'recepcion@gympro.app', password: 'recepcion123' },
  { label: 'Entrenador', email: 'nestor@gympro.app', password: 'entrenador123' },
  { label: 'Contador', email: 'contador@gympro.app', password: 'contador123' },
];

export default function LoginPage() {
  const setSession = useAuthStore((s) => s.setSession);
  const [show, setShow] = useState(false);
  const form = useForm<Form>({ resolver: zodResolver(schema), defaultValues: { email: '', password: '' } });

  const login = useMutation({
    mutationFn: (v: Form) => post<{ accessToken: string; user: AuthUser }>('/auth/login', v),
    onSuccess: (d) => { setSession(d.accessToken, d.user); toast.success(`Bienvenido, ${d.user.name.split(' ')[0]}`); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="min-h-screen grid lg:grid-cols-[1.1fr_1fr]">
      {/* Panel visual */}
      <div className="relative hidden lg:flex flex-col justify-between overflow-hidden bg-side p-12 text-side-ink">
        <div className="absolute inset-0 opacity-[0.35]" style={{ backgroundImage: 'radial-gradient(circle at 20% 20%, rgb(195 241 61 / 0.35), transparent 40%), radial-gradient(circle at 80% 90%, rgb(34 166 179 / 0.25), transparent 45%)' }} />
        <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: 'linear-gradient(rgb(255 255 255) 1px, transparent 1px), linear-gradient(90deg, rgb(255 255 255) 1px, transparent 1px)', backgroundSize: '48px 48px' }} />
        <div className="relative flex items-center gap-3">
          <Logo />
          <span className="font-display text-[20px] font-bold tracking-tight">GYM<span className="text-brand">PRO</span></span>
        </div>
        <div className="relative max-w-md">
          <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-brand">Sistema de gestión</p>
          <h1 className="mt-4 font-display text-[44px] font-bold leading-[1.05] tracking-tight">Todo tu gimnasio,<br />bajo control.</h1>
          <p className="mt-5 text-[15px] leading-relaxed text-side-ink-2">Miembros, membresías, clases, asistencia por QR, pagos, tienda y reportes en un solo lugar. Diseñado para el día a día de recepción, entrenadores y administración.</p>
          <div className="mt-8 grid grid-cols-3 gap-4">
            {[['22', 'módulos'], ['QR', 'check-in'], ['24/7', 'acceso']].map(([v, l]) => (
              <div key={l} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <p className="font-display text-[24px] font-bold text-brand">{v}</p>
                <p className="text-[12px] text-side-ink-2">{l}</p>
              </div>
            ))}
          </div>
        </div>
        <p className="relative text-[12px] text-side-ink-2">© {new Date().getFullYear()} GYM PRO</p>
      </div>

      {/* Formulario */}
      <div className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-sm animate-slide-up">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <Logo />
            <span className="font-display text-[20px] font-bold tracking-tight">GYM<span className="text-brand-ink">PRO</span></span>
          </div>
          <h2 className="font-display text-[26px] font-bold text-ink">Iniciar sesión</h2>
          <p className="mt-1 text-[13.5px] text-ink-2">Ingresa con tu cuenta del gimnasio.</p>

          <form onSubmit={form.handleSubmit((v) => login.mutate(v))} className="mt-7 space-y-4" noValidate>
            <div>
              <Label required>Correo electrónico</Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-3" />
                <Input type="email" placeholder="tu@gimnasio.com" className="pl-9 h-11" invalid={!!form.formState.errors.email} {...form.register('email')} />
              </div>
              <FieldError>{form.formState.errors.email?.message}</FieldError>
            </div>
            <div>
              <Label required>Contraseña</Label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-3" />
                <Input type={show ? 'text' : 'password'} placeholder="••••••••" className="pl-9 pr-10 h-11" invalid={!!form.formState.errors.password} {...form.register('password')} />
                <button type="button" onClick={() => setShow((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-3 hover:text-ink" aria-label="Mostrar contraseña">
                  {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <FieldError>{form.formState.errors.password?.message}</FieldError>
            </div>
            <Button type="submit" size="lg" className="w-full" loading={login.isPending}>Entrar</Button>
          </form>

          <div className="mt-8">
            <p className="text-[11.5px] font-semibold uppercase tracking-[0.1em] text-ink-3">Cuentas de demostración</p>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {DEMO.map((d) => (
                <button key={d.email} type="button" onClick={() => { form.setValue('email', d.email); form.setValue('password', d.password); }}
                  className="rounded-xl border border-line bg-surface px-3 py-2 text-left transition-colors hover:border-line-strong hover:bg-surface-2 focus-ring">
                  <span className="block text-[12.5px] font-semibold text-ink">{d.label}</span>
                  <span className="block truncate text-[11px] text-ink-3">{d.email}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
