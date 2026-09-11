import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, ClipboardCheck, DoorOpen, LogIn, LogOut, Plus, QrCode, ScanLine, Users, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { get, patch, post } from '@/lib/api';
import { cn } from '@/lib/utils';
import { fmtDate, fmtTime, toInputDate } from '@/lib/format';
import { ATTENDANCE_METHOD, MEMBER_STATUS, toOptions } from '@/lib/labels';
import type { Attendance } from '@/types';
import { useList } from '@/hooks/use-list';
import { Avatar, Badge, Button, Card, CardBody, CardHeader, Dialog, Input, PageHeader, Select, StatCard, StatusBadge } from '@/components/ui';
import { DataTable, type Column } from '@/components/data-table';
import { AutoForm, type FieldConfig } from '@/components/auto-form';
import { BarSeries } from '@/components/charts';
import { QrScannerDialog } from '@/components/qr-scanner';
import { Camera } from 'lucide-react';

const manualFields: FieldConfig[] = [
  { name: 'memberId', label: 'Miembro', type: 'select', source: 'members', required: true, colSpan: 2 },
  { name: 'checkIn', label: 'Entrada', type: 'datetime', required: true },
  { name: 'checkOut', label: 'Salida', type: 'datetime' },
  { name: 'note', label: 'Nota', colSpan: 2 },
];

export default function AttendancePage() {
  const qc = useQueryClient();
  const [code, setCode] = useState('');
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [manual, setManual] = useState(false);
  const [scanner, setScanner] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: today } = useQuery({ queryKey: ['attendance', 'today'], queryFn: () => get<any>('/attendance/today'), refetchInterval: 30_000 });
  const { data: stats } = useQuery({ queryKey: ['attendance', 'stats'], queryFn: () => get<any>('/attendance/stats') });
  const ctrl = useList<Attendance>('/attendance', { limit: 10, filters: { from: toInputDate(new Date()), to: toInputDate(new Date()) } });
  const invalidate = () => { qc.invalidateQueries({ queryKey: ['attendance'] }); qc.invalidateQueries({ queryKey: ['/attendance'] }); };

  const checkIn = useMutation({
    mutationFn: (v: any) => post<any>('/attendance/check-in', v),
    onSuccess: (r) => { setResult(r); setError(null); setCode(''); invalidate(); toast.success(r.action === 'CHECK_IN' ? `Entrada: ${r.attendance.member.firstName}` : `Salida: ${r.attendance.member.firstName}`); },
    onError: (e: Error) => { setError(e.message); setResult(null); setCode(''); },
  });
  const createManual = useMutation({ mutationFn: (v: any) => post('/attendance/manual', v), onSuccess: () => { toast.success('Asistencia registrada'); setManual(false); invalidate(); }, onError: (e: Error) => toast.error(e.message) });
  const checkOut = useMutation({ mutationFn: (id: string) => patch(`/attendance/${id}/check-out`), onSuccess: () => { toast.success('Salida registrada'); invalidate(); } });

  useEffect(() => { inputRef.current?.focus(); }, []);
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const v = code.trim(); if (!v) return;
    // Los lectores QR escriben el token y pulsan Enter; los códigos de miembro empiezan por M
    checkIn.mutate(/^M\d+$/i.test(v) ? { code: v.toUpperCase(), method: 'MANUAL' } : { qrToken: v, method: 'QR' });
  };

  const columns: Column<Attendance>[] = [
    { key: 'member', header: 'Miembro', render: (a) => a.member ? <div className="flex items-center gap-3"><Avatar name={`${a.member.firstName} ${a.member.lastName}`} src={a.member.photoUrl} size="sm" /><div><Link to={`/miembros/${a.memberId}`} className="font-medium hover:underline">{a.member.firstName} {a.member.lastName}</Link><p className="text-[12px] text-ink-3">{a.member.code}</p></div></div> : '—' },
    { key: 'checkIn', header: 'Entrada', sortable: true, render: (a) => <span><b>{fmtTime(a.checkIn)}</b> <span className="text-ink-3">· {fmtDate(a.checkIn, 'EEE d MMM')}</span></span> },
    { key: 'checkOut', header: 'Salida', sortable: true, render: (a) => a.checkOut ? fmtTime(a.checkOut) : <Badge tone="success" dot>Dentro</Badge> },
    { key: 'duration', header: 'Duración', render: (a) => { if (!a.checkOut) return '—'; const m = Math.round((new Date(a.checkOut).getTime() - new Date(a.checkIn).getTime()) / 60000); return `${Math.floor(m / 60)}h ${m % 60}m`; } },
    { key: 'method', header: 'Método', sortable: true, render: (a) => <Badge>{ATTENDANCE_METHOD[a.method]}</Badge> },
  ];

  return (
    <div className="animate-slide-up space-y-6">
      <PageHeader eyebrow="Operación" title="Asistencia" description="Control de entradas y salidas por código QR, código de miembro o registro manual." actions={<Button variant="outline" onClick={() => setManual(true)}><Plus className="h-4 w-4" />Registro manual</Button>} />

      <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
        {/* Panel de check-in */}
        <Card className="overflow-hidden">
          <div className="bg-side p-6 text-side-ink">
            <div className="flex items-center gap-3"><span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-brand text-[#14161C]"><ScanLine className="h-5 w-5" /></span><div><p className="font-display text-[16px] font-semibold">Punto de check-in</p><p className="text-[12.5px] text-side-ink-2">Escanea el QR del miembro o escribe su código (p. ej. M30824).</p></div></div>
            <form onSubmit={submit} className="mt-5 flex gap-2">
              <div className="relative flex-1">
                <QrCode className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-side-ink-2" />
                <Input ref={inputRef} value={code} onChange={(e) => setCode(e.target.value)} placeholder="Token QR o código de miembro" className="h-12 border-white/10 bg-white/[0.06] pl-11 text-[15px] text-side-ink placeholder:text-side-ink-2 focus-visible:border-brand" autoComplete="off" />
              </div>
              <Button type="submit" size="lg" className="h-12" loading={checkIn.isPending}><LogIn className="h-4 w-4" />Registrar</Button>
            </form>
            <button type="button" onClick={() => setScanner(true)} className="mt-3 inline-flex items-center gap-2 rounded-xl border border-white/15 px-3.5 py-2 text-[13px] font-semibold text-side-ink hover:bg-white/[0.06]"><Camera className="h-4 w-4 text-brand" />Escanear con la cámara</button>
          </div>
          <CardBody className="pt-5">
            {!result && !error && <div className="flex flex-col items-center py-8 text-center text-ink-3"><DoorOpen className="mb-2 h-8 w-8" /><p className="text-[13px]">Esperando lectura…</p></div>}
            {error && <div className="flex items-start gap-3 rounded-xl border border-danger/30 bg-danger-soft p-4"><XCircle className="mt-0.5 h-5 w-5 shrink-0 text-danger-ink" /><div><p className="font-semibold text-danger-ink">Acceso denegado</p><p className="text-[13px] text-danger-ink/90">{error}</p></div></div>}
            {result && (
              <div className={cn('rounded-2xl border p-4 animate-scale-in', result.action === 'CHECK_IN' ? 'border-success/30 bg-success-soft' : 'border-info/30 bg-info-soft')}>
                <div className="flex items-center gap-4">
                  <Avatar name={`${result.attendance.member.firstName} ${result.attendance.member.lastName}`} src={result.attendance.member.photoUrl} size="xl" />
                  <div className="min-w-0 flex-1">
                    <p className={cn('inline-flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-wider', result.action === 'CHECK_IN' ? 'text-success-ink' : 'text-info-ink')}>{result.action === 'CHECK_IN' ? <><CheckCircle2 className="h-4 w-4" />Entrada registrada</> : <><LogOut className="h-4 w-4" />Salida registrada</>}</p>
                    <p className="font-display text-[20px] font-bold leading-tight">{result.attendance.member.firstName} {result.attendance.member.lastName}</p>
                    <p className="text-[13px] text-ink-2">{result.attendance.member.code} · {result.attendance.member.plan?.name ?? 'Sin plan'} · vence {fmtDate(result.attendance.member.expiresAt)}</p>
                  </div>
                  <StatusBadge value={result.attendance.member.status} map={MEMBER_STATUS} />
                </div>
                {result.bookingAttended && <p className="mt-3 rounded-lg bg-surface/70 px-3 py-1.5 text-[12.5px] font-medium text-ink">✓ Reserva de <b>{result.bookingAttended.className}</b> marcada como asistida.</p>}
              </div>
            )}
          </CardBody>
        </Card>

        <div className="grid grid-cols-2 gap-4 content-start">
          <StatCard label="Asistencias hoy" value={today?.total ?? '…'} icon={<ClipboardCheck />} tone="brand" />
          <StatCard label="Dentro ahora" value={today?.capacity ? `${today.inside} / ${today.capacity}` : today?.inside ?? '…'} hint={today?.capacity ? `${today.occupancy}% del aforo` : undefined} icon={<Users />} tone={today?.occupancy >= 90 ? 'danger' : today?.occupancy >= 70 ? 'warning' : 'success'} />
          <StatCard label="Este mes" value={stats?.month ?? '…'} icon={<ClipboardCheck />} tone="info" />
          <StatCard label="Promedio diario" value={stats?.dailyAverage ?? '…'} hint="últimos 7 días" icon={<Users />} tone="neutral" />
          <Card className="col-span-2">
            <CardHeader title="Afluencia de hoy por hora" />
            <CardBody className="pt-0">{today ? <BarSeries data={today.byHour.map((h: any) => ({ hour: `${String(h.hour).padStart(2, '0')}h`, count: h.count }))} x="hour" series={[{ key: 'count', name: 'Ingresos', color: '#7CB518' }]} height={150} /> : null}</CardBody>
          </Card>
        </div>
      </div>

      <div>
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <h2 className="mr-auto font-display text-[16px] font-semibold">Registro de asistencia</h2>
          <Input type="date" value={(ctrl.filters.from as string) ?? ''} onChange={(e) => ctrl.setFilter('from', e.target.value)} className="w-40" />
          <span className="text-ink-3">→</span>
          <Input type="date" value={(ctrl.filters.to as string) ?? ''} onChange={(e) => ctrl.setFilter('to', e.target.value)} className="w-40" />
          <Select value={(ctrl.filters.method as string) ?? ''} onChange={(e) => ctrl.setFilter('method', e.target.value)} className="w-36"><option value="">Todo método</option>{toOptions(ATTENDANCE_METHOD).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</Select>
          <Button variant="ghost" size="sm" onClick={() => ctrl.setFilters({})}>Ver todo</Button>
        </div>
        <DataTable controller={ctrl} columns={columns} searchPlaceholder="Buscar miembro…" actions={[{ label: 'Registrar salida', icon: <LogOut />, onClick: (a) => checkOut.mutate(a.id), hidden: (a) => !!a.checkOut }]} emptyIcon={<ClipboardCheck />} emptyTitle="Sin asistencias" emptyDescription="No hay registros para el rango seleccionado." />
      </div>

      <QrScannerDialog open={scanner} onOpenChange={setScanner} onDetect={(v) => checkIn.mutate({ qrToken: v, method: 'QR' })} />
      <Dialog open={manual} onOpenChange={setManual} title="Registro manual de asistencia" footer={<><Button variant="ghost" onClick={() => setManual(false)}>Cancelar</Button><Button type="submit" form="manual-form" loading={createManual.isPending}>Guardar</Button></>}>
        <AutoForm id="manual-form" fields={manualFields} defaultValues={{ checkIn: new Date().toISOString() }} onSubmit={(v) => createManual.mutate(v)} />
      </Dialog>
    </div>
  );
}
