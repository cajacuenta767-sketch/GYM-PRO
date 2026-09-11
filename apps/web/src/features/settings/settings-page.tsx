import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Bell, Building2, CreditCard, KeyRound, MapPinned, Palette, Save, Wand2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { BranchesPanel } from './branches-panel';
import { NotificationsPanel } from './notifications-panel';
import { toast } from 'sonner';
import { download, get, put } from '@/lib/api';
import { DatabaseBackup } from 'lucide-react';
import { Button, Card, CardBody, CardHeader, Input, Label, PageHeader, Select, Skeleton, Switch, Tabs, TabsContent, TabsList, TabsTrigger, Textarea, Hint } from '@/components/ui';

type Values = Record<string, any>;

export default function SettingsPage() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { data, isLoading } = useQuery({ queryKey: ['settings'], queryFn: () => get<Values>('/settings') });
  const form = useForm<Values>({ defaultValues: {} });
  useEffect(() => { if (data) form.reset(data); }, [data]); // eslint-disable-line react-hooks/exhaustive-deps
  const save = useMutation({ mutationFn: (values: Values) => put('/settings', { values }), onSuccess: () => { toast.success('Configuración guardada'); qc.invalidateQueries({ queryKey: ['settings'] }); }, onError: (e: Error) => toast.error(e.message) });

  const Text = ({ name, label, hint, type = 'text', placeholder }: { name: string; label: string; hint?: string; type?: string; placeholder?: string }) => (
    <div><Label>{label}</Label><Input type={type} placeholder={placeholder} {...form.register(name)} /><Hint>{hint}</Hint></div>
  );
  const Toggle = ({ name, label, hint }: { name: string; label: string; hint?: string }) => (
    <Controller name={name} control={form.control} render={({ field }) => (
      <div className="flex items-center justify-between gap-4 rounded-xl border border-line p-3.5"><div><p className="text-[13.5px] font-medium">{label}</p>{hint && <p className="text-[12px] text-ink-3">{hint}</p>}</div><Switch checked={!!field.value} onCheckedChange={field.onChange} /></div>
    )} />
  );

  if (isLoading) return <div className="space-y-4"><Skeleton className="h-8 w-56" /><Skeleton className="h-[480px]" /></div>;

  return (
    <form onSubmit={form.handleSubmit((v) => save.mutate(v))} className="animate-slide-up">
      <PageHeader eyebrow="Sistema" title="Configuración general" description="Datos del gimnasio, facturación, notificaciones, apariencia y control de acceso." actions={<><Button type="button" variant="outline" onClick={() => navigate('/configuracion/inicial')}><Wand2 className="h-4 w-4" />Asistente inicial</Button><Button type="submit" loading={save.isPending}><Save className="h-4 w-4" />Guardar cambios</Button></>} />
      <Tabs defaultValue="general" className="grid gap-6 lg:grid-cols-[220px_1fr]">
        <TabsList className="flex h-fit flex-col items-stretch gap-1 bg-transparent border-0 p-0">
          {[['general', 'General', <Building2 key="g" />], ['branches', 'Sedes', <MapPinned key="s" />], ['billing', 'Facturación', <CreditCard key="b" />], ['notifications', 'Notificaciones', <Bell key="n" />], ['appearance', 'Apariencia', <Palette key="a" />], ['access', 'Acceso', <KeyRound key="k" />]].map(([v, l, i]) => (
            <TabsTrigger key={v as string} value={v as string} className="justify-start gap-2.5 px-3 py-2.5 data-[state=active]:bg-surface data-[state=active]:shadow-card [&_svg]:h-4 [&_svg]:w-4">{i}{l}</TabsTrigger>
          ))}
        </TabsList>
        <div>
          <TabsContent value="general">
            <Card><CardHeader title="Datos del gimnasio" description="Aparecen en facturas, boletines y en la pantalla de inicio." /><CardBody className="grid gap-4 sm:grid-cols-2">
              <Text name="gymName" label="Nombre" /><Text name="slogan" label="Eslogan" /><Text name="email" label="Correo" type="email" /><Text name="phone" label="Teléfono" /><Text name="address" label="Dirección" /><Text name="city" label="Ciudad" /><Text name="website" label="Sitio web" /><Text name="logoUrl" label="URL del logotipo" />
              <div><Label>Zona horaria</Label><Select {...form.register('timezone')}>{['America/Bogota', 'America/Mexico_City', 'America/Lima', 'America/Santiago', 'America/Argentina/Buenos_Aires', 'Europe/Madrid'].map((z) => <option key={z} value={z}>{z}</option>)}</Select></div>
              <div><Label>Idioma</Label><Select {...form.register('language')}><option value="es">Español</option><option value="en">English</option></Select></div>
              <div className="sm:col-span-2"><Label>Horario de atención</Label><Textarea rows={2} {...form.register('openingHours')} /></div>
            </CardBody></Card>
            <Card className="mt-4"><CardHeader title="Copia de seguridad" description="Descarga todos los datos del sistema en un archivo JSON (sin contraseñas)." icon={<DatabaseBackup />} action={<Button type="button" variant="outline" onClick={() => download('/settings/backup', `gympro-backup-${new Date().toISOString().slice(0, 10)}.json`)}>Descargar copia</Button>} /></Card>
          </TabsContent>
          <TabsContent value="branches"><BranchesPanel /></TabsContent>
          <TabsContent value="billing">
            <Card><CardHeader title="Facturación y pagos" /><CardBody className="grid gap-4 sm:grid-cols-2">
              <div><Label>Moneda</Label><Select {...form.register('currency')}>{['USD', 'COP', 'MXN', 'PEN', 'CLP', 'ARS', 'EUR'].map((c) => <option key={c}>{c}</option>)}</Select></div>
              <Text name="currencySymbol" label="Símbolo" /><Text name="taxRate" label="Impuesto (%)" type="number" hint="Se aplica a las ventas de tienda." /><Text name="invoicePrefix" label="Prefijo de factura" /><Text name="lateFee" label="Recargo por mora" type="number" />
              <div className="sm:col-span-2 grid gap-3"><Toggle name="stripeEnabled" label="Pagos con Stripe" hint="Permite cobrar membresías en línea." /><Text name="stripePublicKey" label="Clave pública de Stripe" placeholder="pk_live_…" /></div>
            </CardBody></Card>
          </TabsContent>
          <TabsContent value="notifications">
            <Card><CardHeader title="Notificaciones automáticas" /><CardBody className="grid gap-3">
              <Toggle name="notifyExpiring" label="Aviso de vencimiento" hint="Notifica a los miembros antes de que venza su membresía." /><Text name="expiringDays" label="Días de anticipación" type="number" />
              <Toggle name="notifyBirthday" label="Felicitación de cumpleaños" /><Toggle name="notifyNewMember" label="Bienvenida a nuevos miembros" />
              <div className="grid gap-4 sm:grid-cols-2 pt-2"><Text name="smtpHost" label="Servidor SMTP" placeholder="smtp.tu-dominio.com" hint="Vacío = los correos se guardan como vista previa." /><Text name="smtpPort" label="Puerto" type="number" placeholder="587" /><Text name="smtpUser" label="Usuario SMTP" /><Text name="smtpPass" label="Contraseña SMTP" type="password" /><Text name="smtpFrom" label="Remitente" type="email" /><Text name="whatsappNumber" label="WhatsApp del gimnasio" placeholder="573001234567" hint="Con código de país, sin espacios. Se usa en la página pública y enlaces rápidos." /></div>
            </CardBody></Card>
            <div className="mt-4"><NotificationsPanel /></div>
          </TabsContent>
          <TabsContent value="appearance">
            <Card><CardHeader title="Apariencia" /><CardBody className="grid gap-4 sm:grid-cols-2">
              <div><Label>Color principal</Label><Controller name="primaryColor" control={form.control} render={({ field }) => <div className="flex items-center gap-2"><input type="color" value={field.value || '#C3F13D'} onChange={(e) => field.onChange(e.target.value)} className="h-[38px] w-12 cursor-pointer rounded-lg border border-line bg-surface p-1" /><Input value={field.value ?? ''} onChange={(e) => field.onChange(e.target.value)} className="font-mono" /></div>} /></div>
              <div><Label>Tema por defecto</Label><Select {...form.register('theme')}><option value="system">Según el sistema</option><option value="light">Claro</option><option value="dark">Oscuro</option></Select></div>
              <div className="sm:col-span-2"><Toggle name="compactSidebar" label="Menú lateral compacto por defecto" /></div>
            </CardBody></Card>
          </TabsContent>
          <TabsContent value="access">
            <Card><CardHeader title="Control de acceso" description="Reglas para el check-in y el torniquete." /><CardBody className="grid gap-3">
              <Toggle name="qrCheckIn" label="Check-in por código QR" hint="Cada miembro tiene un QR único en su ficha." />
              <Text name="autoCheckOutMinutes" label="Salida automática (minutos)" type="number" hint="Cierra la visita si no se registra salida." />
              <Toggle name="allowExpiredGrace" label="Permitir acceso con membresía recién vencida" /><Text name="graceDays" label="Días de gracia" type="number" />
              <Text name="maxCapacity" label="Aforo máximo (personas dentro a la vez)" type="number" hint="Vacío o 0 = sin límite. Se muestra en el panel de asistencia." />
            </CardBody></Card>
          </TabsContent>
        </div>
      </Tabs>
    </form>
  );
}
