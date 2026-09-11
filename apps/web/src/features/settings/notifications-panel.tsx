import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Mail, Play, Send } from 'lucide-react';
import { toast } from 'sonner';
import { get, list, post } from '@/lib/api';
import { fmtDateTime } from '@/lib/format';
import { NOTIFICATION_LOG_STATUS } from '@/lib/labels';
import { Badge, Button, Card, CardBody, CardHeader, Input, StatusBadge } from '@/components/ui';

/** Herramientas de notificaciones: correo de prueba, ejecución de la tarea diaria y registro de envíos. */
export function NotificationsPanel() {
  const qc = useQueryClient();
  const [to, setTo] = useState('');
  const { data: logs } = useQuery({ queryKey: ['notifications', 'logs'], queryFn: () => list<any>('/notifications/logs', { limit: 12 }) });
  const { data: settings } = useQuery({ queryKey: ['settings'], queryFn: () => get<Record<string, any>>('/settings') });
  const test = useMutation({ mutationFn: () => post<any>('/notifications/test-email', { to }), onSuccess: (r) => { toast.success(r.status === 'SENT' ? 'Correo enviado' : 'Sin SMTP configurado: se guardó una vista previa'); qc.invalidateQueries({ queryKey: ['notifications', 'logs'] }); }, onError: (e: Error) => toast.error(e.message) });
  const run = useMutation({ mutationFn: () => post<any>('/notifications/run-daily'), onSuccess: (r) => { toast.success(`Tarea ejecutada: ${r.expiring} vencimientos, ${r.birthdays} cumpleaños, ${r.lowStock} productos con stock bajo`); qc.invalidateQueries({ queryKey: ['notifications'] }); }, onError: (e: Error) => toast.error(e.message) });
  const smtpReady = !!settings?.smtpHost;
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader title="Estado del correo" description={smtpReady ? `Servidor SMTP configurado (${settings?.smtpHost}).` : 'Sin servidor SMTP: los correos se guardan como vista previa en el registro de abajo.'} icon={<Mail />} action={<Badge tone={smtpReady ? 'success' : 'warning'}>{smtpReady ? 'Envío real' : 'Modo vista previa'}</Badge>} />
        <CardBody className="flex flex-wrap items-end gap-3 pt-0">
          <div className="flex-1 min-w-[220px]"><Input type="email" placeholder="correo@ejemplo.com" value={to} onChange={(e) => setTo(e.target.value)} /></div>
          <Button variant="outline" onClick={() => test.mutate()} disabled={!to} loading={test.isPending}><Send className="h-4 w-4" />Enviar prueba</Button>
          <Button variant="dark" onClick={() => run.mutate()} loading={run.isPending}><Play className="h-4 w-4" />Ejecutar tarea diaria ahora</Button>
        </CardBody>
      </Card>
      <Card>
        <CardHeader title="Registro de envíos" description="Últimos correos enviados o generados en vista previa" />
        <ul className="divide-y divide-line">
          {logs?.data.map((l: any) => <li key={l.id} className="flex items-center gap-3 px-5 py-2.5 text-[13px]"><span className="w-36 shrink-0 text-ink-3">{fmtDateTime(l.createdAt)}</span><span className="min-w-0 flex-1 truncate"><b>{l.recipient}</b> · {l.subject}</span><Badge>{l.template ?? l.channel}</Badge><StatusBadge value={l.status} map={NOTIFICATION_LOG_STATUS} /></li>)}
          {logs && logs.data.length === 0 && <li className="px-5 py-6 text-center text-[13px] text-ink-3">Sin envíos todavía.</li>}
        </ul>
      </Card>
    </div>
  );
}
