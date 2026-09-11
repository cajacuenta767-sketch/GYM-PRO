import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Building2, Check, CreditCard, Rocket, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { get, post, put } from '@/lib/api';
import { cn } from '@/lib/utils';
import { Button, Card, CardBody, Input, Label, PageHeader, Select, Textarea } from '@/components/ui';

const STEPS = [{ t: 'Tu gimnasio', i: <Building2 /> }, { t: 'Primer plan', i: <Sparkles /> }, { t: 'Facturación', i: <CreditCard /> }, { t: 'Listo', i: <Rocket /> }];

/** Asistente de configuración inicial para un gimnasio nuevo. */
export default function SetupWizardPage() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const { data: settings } = useQuery({ queryKey: ['settings'], queryFn: () => get<Record<string, any>>('/settings') });
  const gym = useForm<any>({ values: settings ? { gymName: settings.gymName ?? '', slogan: settings.slogan ?? '', email: settings.email ?? '', phone: settings.phone ?? '', address: settings.address ?? '', city: settings.city ?? '', openingHours: settings.openingHours ?? '', whatsappNumber: settings.whatsappNumber ?? '' } : undefined });
  const plan = useForm<any>({ defaultValues: { name: 'Mensual', durationDays: 30, price: 35, registrationFee: 0 } });
  const billing = useForm<any>({ values: settings ? { currency: settings.currency ?? 'USD', currencySymbol: settings.currencySymbol ?? '$', taxRate: settings.taxRate ?? 0, invoicePrefix: settings.invoicePrefix ?? 'FAC' } : undefined });
  const saveSettings = useMutation({ mutationFn: (values: any) => put('/settings', { values }), onSuccess: () => qc.invalidateQueries({ queryKey: ['settings'] }), onError: (e: Error) => toast.error(e.message) });
  const createPlan = useMutation({ mutationFn: (v: any) => post('/memberships', { ...v, durationDays: Number(v.durationDays), price: Number(v.price), registrationFee: Number(v.registrationFee), color: '#C3F13D', benefits: ['Acceso a todas las áreas'] }), onError: (e: Error) => toast.error(e.message) });

  const next = async () => {
    if (step === 0) await saveSettings.mutateAsync(gym.getValues());
    if (step === 1 && plan.getValues().name) await createPlan.mutateAsync(plan.getValues());
    if (step === 2) await saveSettings.mutateAsync({ ...billing.getValues(), setupCompleted: true });
    setStep((s) => s + 1);
  };

  return (
    <div className="mx-auto max-w-3xl animate-slide-up">
      <PageHeader eyebrow="Configuración" title="Asistente de configuración inicial" description="Cuatro pasos para dejar el sistema listo para operar." />
      <ol className="mb-6 grid grid-cols-4 gap-2">
        {STEPS.map((s, i) => <li key={s.t} className={cn('flex items-center gap-2 rounded-xl border p-3 text-[12.5px] font-semibold', i === step ? 'border-brand bg-brand-soft/50 text-ink' : i < step ? 'border-line bg-surface text-success-ink' : 'border-line bg-surface text-ink-3')}><span className="[&_svg]:h-4 [&_svg]:w-4">{i < step ? <Check /> : s.i}</span><span className="hidden sm:inline">{s.t}</span></li>)}
      </ol>
      <Card>
        <CardBody className="pt-6">
          {step === 0 && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2"><Label required>Nombre del gimnasio</Label><Input {...gym.register('gymName')} /></div>
              <div className="sm:col-span-2"><Label>Eslogan</Label><Input {...gym.register('slogan')} /></div>
              <div><Label>Correo</Label><Input type="email" {...gym.register('email')} /></div><div><Label>Teléfono</Label><Input {...gym.register('phone')} /></div>
              <div><Label>Dirección</Label><Input {...gym.register('address')} /></div><div><Label>Ciudad</Label><Input {...gym.register('city')} /></div>
              <div><Label>WhatsApp (con código de país)</Label><Input placeholder="573001234567" {...gym.register('whatsappNumber')} /></div>
              <div className="sm:col-span-2"><Label>Horario de atención</Label><Textarea rows={2} className="min-h-[60px]" {...gym.register('openingHours')} /></div>
            </div>
          )}
          {step === 1 && (
            <div className="grid gap-4 sm:grid-cols-2">
              <p className="sm:col-span-2 text-[13.5px] text-ink-2">Crea tu primer tipo de membresía. Podrás añadir más después en “Tipos de membresía”. Déjalo vacío para omitir.</p>
              <div className="sm:col-span-2"><Label>Nombre del plan</Label><Input {...plan.register('name')} /></div>
              <div><Label>Duración (días)</Label><Input type="number" {...plan.register('durationDays')} /></div><div><Label>Precio</Label><Input type="number" step="0.01" {...plan.register('price')} /></div>
              <div><Label>Tarifa de inscripción</Label><Input type="number" step="0.01" {...plan.register('registrationFee')} /></div>
            </div>
          )}
          {step === 2 && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div><Label>Moneda</Label><Select {...billing.register('currency')}>{['USD', 'COP', 'MXN', 'PEN', 'CLP', 'ARS', 'EUR'].map((c) => <option key={c}>{c}</option>)}</Select></div>
              <div><Label>Símbolo</Label><Input {...billing.register('currencySymbol')} /></div>
              <div><Label>Impuesto en tienda (%)</Label><Input type="number" {...billing.register('taxRate')} /></div>
              <div><Label>Prefijo de factura</Label><Input {...billing.register('invoicePrefix')} /></div>
            </div>
          )}
          {step === 3 && (
            <div className="py-6 text-center"><Rocket className="mx-auto h-12 w-12 text-brand-ink" /><h2 className="mt-3 font-display text-[22px] font-bold">¡Todo listo!</h2><p className="mt-1 text-[13.5px] text-ink-2">Ya puedes registrar miembros, crear clases y empezar a operar. Configura correo y pagos en línea cuando lo necesites.</p><div className="mt-6 flex justify-center gap-2"><Button onClick={() => navigate('/miembros?nuevo=1')}>Registrar primer miembro</Button><Button variant="outline" onClick={() => navigate('/')}>Ir al tablero</Button></div></div>
          )}
          {step < 3 && <div className="mt-6 flex justify-between border-t border-line pt-4"><Button variant="ghost" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}>Atrás</Button><Button onClick={next} loading={saveSettings.isPending || createPlan.isPending}>{step === 2 ? 'Finalizar' : 'Continuar'}</Button></div>}
        </CardBody>
      </Card>
    </div>
  );
}
