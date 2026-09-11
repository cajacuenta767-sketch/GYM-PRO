import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { get, patch } from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';
import { Avatar, Button, Card, CardBody, CardHeader, FieldError, InfoRow, Input, Label, PageHeader } from '@/components/ui';
import { fmtDate } from '@/lib/format';
import { ImageUpload } from '@/components/image-upload';

export default function PortalProfilePage() {
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const { data } = useQuery({ queryKey: ['portal', 'home'], queryFn: () => get<any>('/portal/home') });
  const m = data?.member;
  const form = useForm<any>({ defaultValues: {} });
  useEffect(() => { if (m) form.reset({ phone: m.phone ?? '', address: m.address ?? '', emergencyContact: m.emergencyContact ?? '', interestArea: m.interestArea ?? '', photoUrl: m.photoUrl ?? '' }); }, [m]); // eslint-disable-line react-hooks/exhaustive-deps
  const save = useMutation({ mutationFn: (v: any) => patch('/portal/profile', v), onSuccess: () => { toast.success('Perfil actualizado'); qc.invalidateQueries({ queryKey: ['portal'] }); }, onError: (e: Error) => toast.error(e.message) });
  const pwd = useForm<{ currentPassword: string; newPassword: string }>();
  const change = useMutation({ mutationFn: (v: any) => patch('/auth/password', v), onSuccess: () => { toast.success('Contraseña actualizada'); pwd.reset(); }, onError: (e: Error) => toast.error(e.message) });

  return (
    <div className="animate-slide-up space-y-5">
      <PageHeader title="Mi perfil" />
      <Card>
        <CardBody className="pt-6">
          <div className="flex items-center gap-4"><Avatar name={user?.name} src={form.watch('photoUrl') || m?.photoUrl} size="xl" /><div><p className="font-display text-[18px] font-semibold">{user?.name}</p><p className="text-[13px] text-ink-2">{user?.email}</p></div></div>
          <div className="mt-5"><InfoRow label="Código" value={m?.code} /><InfoRow label="Miembro desde" value={fmtDate(m?.joinDate)} /><InfoRow label="Entrenador" value={m?.trainer ? `${m.trainer.firstName} ${m.trainer.lastName}` : '—'} /><InfoRow label="Sede" value={m?.branch?.name} /></div>
        </CardBody>
      </Card>
      <Card>
        <CardHeader title="Datos de contacto" />
        <CardBody>
          <form className="grid gap-4 sm:grid-cols-2" onSubmit={form.handleSubmit((v) => save.mutate(v))}>
            <div className="sm:col-span-2"><Label>Foto</Label><ImageUpload value={form.watch('photoUrl')} onChange={(u) => form.setValue('photoUrl', u)} /></div>
            <div><Label>Teléfono</Label><Input {...form.register('phone')} /></div>
            <div><Label>Área de interés</Label><Input {...form.register('interestArea')} /></div>
            <div className="sm:col-span-2"><Label>Dirección</Label><Input {...form.register('address')} /></div>
            <div className="sm:col-span-2"><Label>Contacto de emergencia</Label><Input {...form.register('emergencyContact')} placeholder="Nombre · teléfono" /></div>
            <div className="sm:col-span-2"><Button type="submit" loading={save.isPending}>Guardar</Button></div>
          </form>
        </CardBody>
      </Card>
      <Card>
        <CardHeader title="Cambiar contraseña" />
        <CardBody>
          <form className="grid max-w-sm gap-4" onSubmit={pwd.handleSubmit((v) => change.mutate(v))}>
            <div><Label required>Contraseña actual</Label><Input type="password" {...pwd.register('currentPassword', { required: 'Obligatorio' })} /><FieldError>{pwd.formState.errors.currentPassword?.message}</FieldError></div>
            <div><Label required>Nueva contraseña</Label><Input type="password" {...pwd.register('newPassword', { required: 'Obligatorio', minLength: { value: 6, message: 'Mínimo 6 caracteres' } })} /><FieldError>{pwd.formState.errors.newPassword?.message}</FieldError></div>
            <div><Button type="submit" variant="outline" loading={change.isPending}>Actualizar</Button></div>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
