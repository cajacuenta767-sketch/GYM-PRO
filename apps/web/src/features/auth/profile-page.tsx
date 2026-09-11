import { useForm } from 'react-hook-form';
import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { get, patch } from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';
import { Avatar, Badge, Button, Card, CardBody, CardHeader, FieldError, InfoRow, Input, Label, PageHeader } from '@/components/ui';
import { USER_ROLE } from '@/lib/labels';
import { fmtDateTime } from '@/lib/format';

export default function ProfilePage() {
  const user = useAuthStore((s) => s.user);
  const { data } = useQuery({ queryKey: ['auth', 'me'], queryFn: () => get<any>('/auth/me') });
  const form = useForm<{ currentPassword: string; newPassword: string; confirm: string }>();
  const change = useMutation({
    mutationFn: (v: any) => patch('/auth/password', { currentPassword: v.currentPassword, newPassword: v.newPassword }),
    onSuccess: () => { toast.success('Contraseña actualizada'); form.reset(); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="animate-slide-up">
      <PageHeader eyebrow="Cuenta" title="Mi perfil" description="Datos de tu cuenta y seguridad." />
      <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        <Card>
          <CardBody className="pt-6">
            <div className="flex items-center gap-4">
              <Avatar name={user?.name} src={user?.avatarUrl} size="xl" />
              <div>
                <p className="font-display text-[18px] font-semibold">{user?.name}</p>
                <p className="text-[13px] text-ink-2">{user?.email}</p>
                <div className="mt-2 flex gap-2"><Badge tone="brand">{USER_ROLE[user?.role ?? ''] ?? user?.role}</Badge>{user?.roleName && <Badge>{user.roleName}</Badge>}</div>
              </div>
            </div>
            <div className="mt-6">
              <InfoRow label="Último acceso" value={fmtDateTime(data?.lastLoginAt)} />
              <InfoRow label="Cuenta creada" value={fmtDateTime(data?.createdAt)} />
              <InfoRow label="Permisos" value={`${user?.permissions?.length ?? 0} permisos asignados`} />
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Cambiar contraseña" description="Usa al menos 6 caracteres." />
          <CardBody>
            <form className="space-y-4 max-w-sm" onSubmit={form.handleSubmit((v) => { if (v.newPassword !== v.confirm) { form.setError('confirm', { message: 'Las contraseñas no coinciden' }); return; } change.mutate(v); })}>
              <div><Label required>Contraseña actual</Label><Input type="password" {...form.register('currentPassword', { required: 'Obligatorio' })} /><FieldError>{form.formState.errors.currentPassword?.message}</FieldError></div>
              <div><Label required>Nueva contraseña</Label><Input type="password" {...form.register('newPassword', { required: 'Obligatorio', minLength: { value: 6, message: 'Mínimo 6 caracteres' } })} /><FieldError>{form.formState.errors.newPassword?.message}</FieldError></div>
              <div><Label required>Confirmar</Label><Input type="password" {...form.register('confirm', { required: 'Obligatorio' })} /><FieldError>{form.formState.errors.confirm?.message}</FieldError></div>
              <Button type="submit" loading={change.isPending}>Actualizar contraseña</Button>
            </form>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
