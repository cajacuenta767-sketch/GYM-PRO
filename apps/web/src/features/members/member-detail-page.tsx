import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { QRCodeSVG } from 'qrcode.react';
import { toast } from 'sonner';
import { ArrowLeft, Cake, CalendarDays, ClipboardCheck, CreditCard, Dumbbell, Heart, Mail, MapPin, Pencil, Phone, Plus, QrCode, Trash2, User, UsersRound } from 'lucide-react';
import { del, get, patch, post } from '@/lib/api';
import { age, fmtDate, fmtDateTime, fmtMoney, fmtTime, daysUntil } from '@/lib/format';
import { ATTENDANCE_METHOD, BOOKING_STATUS, GENDER, MEAL_TYPE, MEASUREMENT_TYPE, MEMBER_STATUS, PAYMENT_METHOD, PAYMENT_STATUS, SUBSCRIPTION_STATUS, toOptions } from '@/lib/labels';
import { DAYS_ES } from '@/lib/format';
import type { MemberDetail } from '@/types';
import { Avatar, Badge, Button, Card, CardBody, CardHeader, ColorDot, ConfirmDialog, Dialog, EmptyState, InfoRow, Skeleton, StatusBadge, Tabs, TabsContent, UnderlineTab, UnderlineTabsList } from '@/components/ui';
import { AutoForm, type FieldConfig } from '@/components/auto-form';
import { AreaSeries } from '@/components/charts';
import { memberFields, memberToForm } from './fields';

const measurementFields: FieldConfig[] = [
  { name: 'type', label: 'Tipo de medición', type: 'select', options: toOptions(MEASUREMENT_TYPE), required: true },
  { name: 'value', label: 'Valor', type: 'number', required: true, step: 0.1 },
  { name: 'measuredAt', label: 'Fecha', type: 'date' },
  { name: 'note', label: 'Nota', placeholder: 'Opcional' },
];
const subscriptionFields: FieldConfig[] = [
  { name: 'planId', label: 'Plan', type: 'select', source: 'plans', required: true },
  { name: 'startDate', label: 'Fecha de inicio', type: 'date' },
  { name: 'price', label: 'Precio (vacío = precio del plan)', type: 'number', step: 0.01 },
  { name: 'paymentMethod', label: 'Método de pago', type: 'select', options: toOptions(PAYMENT_METHOD) },
  { name: 'registerPayment', label: 'Registrar el pago ahora', type: 'switch' },
  { name: 'notes', label: 'Notas', type: 'textarea' },
];
const paymentFields: FieldConfig[] = [
  { name: 'concept', label: 'Concepto', required: true, colSpan: 2, placeholder: 'Membresía Oro · Octubre' },
  { name: 'amount', label: 'Monto', type: 'number', required: true, step: 0.01 },
  { name: 'method', label: 'Método', type: 'select', options: toOptions(PAYMENT_METHOD), required: true },
  { name: 'status', label: 'Estado', type: 'select', options: toOptions(PAYMENT_STATUS), required: true },
  { name: 'paidAt', label: 'Fecha', type: 'date' },
  { name: 'reference', label: 'Referencia' },
  { name: 'notes', label: 'Notas' },
];

export default function MemberDetailPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [dialog, setDialog] = useState<null | 'edit' | 'measure' | 'subscription' | 'payment' | 'delete'>(null);
  const { data: m, isLoading } = useQuery({ queryKey: ['members', id], queryFn: () => get<MemberDetail>(`/members/${id}`) });
  const { data: nutrition } = useQuery({ queryKey: ['nutrition', 'weekly', id], queryFn: () => get<any[]>(`/nutrition/member/${id}/weekly`), enabled: !!id });
  const refresh = () => { qc.invalidateQueries({ queryKey: ['members', id] }); qc.invalidateQueries({ queryKey: ['/members'] }); };

  const mutate = (fn: (v: any) => Promise<any>, msg: string) => useMutation({ mutationFn: fn, onSuccess: () => { toast.success(msg); setDialog(null); refresh(); }, onError: (e: Error) => toast.error(e.message) });
  const edit = mutate((v) => patch(`/members/${id}`, v), 'Miembro actualizado');
  const addMeasure = mutate((v) => post(`/members/${id}/measurements`, v), 'Medición registrada');
  const addSub = mutate((v) => post('/subscriptions', { ...v, memberId: id }), 'Suscripción registrada');
  const addPay = mutate((v) => post('/payments', { ...v, memberId: id }), 'Pago registrado');
  const remove = useMutation({ mutationFn: () => del(`/members/${id}`), onSuccess: () => { toast.success('Miembro eliminado'); navigate('/miembros'); }, onError: (e: Error) => toast.error(e.message) });
  const removeMeasure = useMutation({ mutationFn: (mid: string) => del(`/members/${id}/measurements/${mid}`), onSuccess: refresh });
  const checkIn = useMutation({ mutationFn: () => post<any>('/attendance/check-in', { memberId: id, method: 'MANUAL' }), onSuccess: (r) => { toast.success(r.action === 'CHECK_IN' ? 'Entrada registrada' : 'Salida registrada'); refresh(); }, onError: (e: Error) => toast.error(e.message) });

  if (isLoading || !m) return <div className="space-y-4"><Skeleton className="h-8 w-40" /><Skeleton className="h-40" /><Skeleton className="h-96" /></div>;

  const name = `${m.firstName} ${m.lastName}`;
  const series = (type: string) => m.measurements.filter((x) => x.type === type).map((x) => ({ label: fmtDate(x.measuredAt, 'd MMM'), value: x.value }));
  const last = (type: string) => m.measurements.filter((x) => x.type === type).at(-1);
  const d = daysUntil(m.expiresAt);

  return (
    <div className="animate-slide-up space-y-6">
      <div>
        <Link to="/miembros" className="inline-flex items-center gap-1.5 text-[13px] font-medium text-ink-2 hover:text-ink"><ArrowLeft className="h-4 w-4" />Lista de miembros</Link>
      </div>

      {/* Cabecera */}
      <Card>
        <CardBody className="pt-5">
          <div className="flex flex-col gap-5 md:flex-row md:items-start">
            <Avatar name={name} src={m.photoUrl} size="2xl" square />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-[24px] font-bold leading-tight">{name}</h1>
                <StatusBadge value={m.status} map={MEMBER_STATUS} />
                {m.plan && <Badge tone="brand"><ColorDot color={m.plan.color} />{m.plan.name}</Badge>}
              </div>
              <p className="mt-1 text-[13px] text-ink-2">ID <b className="text-ink">{m.code}</b> · miembro desde {fmtDate(m.joinDate)} {m.expiresAt && <>· vence el <b className={d !== null && d <= 7 ? 'text-danger-ink' : 'text-ink'}>{fmtDate(m.expiresAt)}</b>{d !== null && d > 0 && d <= 7 ? ` (en ${d} días)` : ''}</>}</p>
              <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-[13px] text-ink-2">
                {m.email && <span className="inline-flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" />{m.email}</span>}
                {m.phone && <span className="inline-flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" />{m.phone}</span>}
                {m.address && <span className="inline-flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" />{m.address}</span>}
                {m.birthDate && <span className="inline-flex items-center gap-1.5"><Cake className="h-3.5 w-3.5" />{fmtDate(m.birthDate)} · {age(m.birthDate)} años</span>}
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button size="sm" onClick={() => checkIn.mutate()} loading={checkIn.isPending}><ClipboardCheck className="h-4 w-4" />Check-in / out</Button>
                <Button size="sm" variant="dark" onClick={() => setDialog('subscription')}><CalendarDays className="h-4 w-4" />Nueva suscripción</Button>
                <Button size="sm" variant="secondary" onClick={() => setDialog('payment')}><CreditCard className="h-4 w-4" />Registrar pago</Button>
                <Button size="sm" variant="outline" onClick={() => setDialog('edit')}><Pencil className="h-4 w-4" />Editar</Button>
                <Button size="sm" variant="ghost" className="text-danger-ink" onClick={() => setDialog('delete')}><Trash2 className="h-4 w-4" /></Button>
              </div>
            </div>
            <div className="flex shrink-0 flex-col items-center gap-2 rounded-2xl border border-line bg-surface-2/60 p-3">
              <div className="rounded-xl bg-white p-2"><QRCodeSVG value={m.qrToken} size={104} level="M" /></div>
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-ink-3"><QrCode className="h-3 w-3" />Código de acceso</span>
            </div>
          </div>
        </CardBody>
      </Card>

      <Tabs defaultValue="resumen">
        <UnderlineTabsList>
          <UnderlineTab value="resumen">Resumen</UnderlineTab>
          <UnderlineTab value="mediciones" count={m.measurements.length}>Mediciones</UnderlineTab>
          <UnderlineTab value="suscripciones" count={m.subscriptions.length}>Suscripciones</UnderlineTab>
          <UnderlineTab value="pagos" count={m.payments.length}>Pagos</UnderlineTab>
          <UnderlineTab value="asistencia" count={m.attendance.length}>Asistencia</UnderlineTab>
          <UnderlineTab value="reservas" count={m.bookings.length}>Reservas</UnderlineTab>
          <UnderlineTab value="nutricion">Nutrición</UnderlineTab>
        </UnderlineTabsList>

        <TabsContent value="resumen" className="mt-5 grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader title="Información personal" icon={<User />} />
            <CardBody className="pt-0">
              <InfoRow label="Género" value={m.gender ? GENDER[m.gender] : null} />
              <InfoRow label="Nombre de usuario" value={m.username} />
              <InfoRow label="Contacto de emergencia" value={m.emergencyContact} />
              <InfoRow label="Área de interés" value={m.interestArea} icon={<Heart />} />
              <InfoRow label="Entrenador" value={m.trainer ? `${m.trainer.firstName} ${m.trainer.lastName}${m.trainer.specialty ? ` · ${m.trainer.specialty}` : ''}` : null} />
              <InfoRow label="Notas" value={m.notes} />
            </CardBody>
          </Card>
          <div className="space-y-6">
            <Card>
              <CardHeader title="Afiliación" icon={<CalendarDays />} />
              <CardBody className="pt-0">
                <InfoRow label="Membresía" value={m.plan ? <span className="inline-flex items-center gap-2"><ColorDot color={m.plan.color} />{m.plan.name} · {fmtMoney(m.plan.price)}</span> : null} />
                <InfoRow label="Fecha de caducidad" value={fmtDate(m.expiresAt)} />
                <InfoRow label="Grupos" value={m.groups.length ? <span className="flex flex-wrap gap-1.5">{m.groups.map((g) => <Badge key={g.id}><ColorDot color={g.color} />{g.name}</Badge>)}</span> : null} icon={<UsersRound />} />
                <InfoRow label="Clases" value={m.classes.length ? <span className="flex flex-wrap gap-1.5">{m.classes.map((c) => <Badge key={c.id}><ColorDot color={c.color} />{c.name}</Badge>)}</span> : null} icon={<Dumbbell />} />
              </CardBody>
            </Card>
            <div className="grid grid-cols-2 gap-4">
              {(['WEIGHT', 'WAIST'] as const).map((t) => {
                const l = last(t);
                return (
                  <Card key={t}>
                    <CardHeader title={MEASUREMENT_TYPE[t]} description={l ? `Último: ${fmtDate(l.measuredAt)}` : 'Sin datos'} />
                    <CardBody className="pt-0">
                      <p className="kpi-number text-[28px]">{l ? `${l.value} ${l.unit}` : '—'}</p>
                      {series(t).length > 1 && <div className="mt-2 -mx-2"><AreaSeries data={series(t)} x="label" y="value" name={MEASUREMENT_TYPE[t]} height={90} /></div>}
                    </CardBody>
                  </Card>
                );
              })}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="mediciones" className="mt-5 space-y-6">
          <div className="flex justify-end"><Button onClick={() => setDialog('measure')}><Plus className="h-4 w-4" />Agregar medición</Button></div>
          <div className="grid gap-6 lg:grid-cols-2">
            {(['WEIGHT', 'WAIST'] as const).map((t) => (
              <Card key={t}><CardHeader title={`Informe de ${MEASUREMENT_TYPE[t].toLowerCase()}`} description="Evolución en el tiempo" /><CardBody>{series(t).length ? <AreaSeries data={series(t)} x="label" y="value" name={MEASUREMENT_TYPE[t]} /> : <EmptyState title="Sin mediciones" description="Registra la primera medición para ver la gráfica." />}</CardBody></Card>
            ))}
          </div>
          <Card>
            <CardHeader title="Historial" />
            <table className="w-full text-[13.5px]">
              <thead><tr className="border-y border-line bg-surface-2/60 text-[11.5px] uppercase tracking-wider text-ink-3"><th className="px-5 py-2 text-left">Fecha</th><th className="px-5 py-2 text-left">Tipo</th><th className="px-5 py-2 text-left">Valor</th><th className="px-5 py-2 text-left">Nota</th><th /></tr></thead>
              <tbody>{[...m.measurements].reverse().map((x) => (
                <tr key={x.id} className="border-b border-line last:border-0"><td className="px-5 py-2.5">{fmtDate(x.measuredAt)}</td><td className="px-5 py-2.5">{MEASUREMENT_TYPE[x.type]}</td><td className="px-5 py-2.5 font-semibold">{x.value} {x.unit}</td><td className="px-5 py-2.5 text-ink-2">{x.note ?? '—'}</td><td className="px-3 py-2 text-right"><Button variant="ghost" size="icon-sm" onClick={() => removeMeasure.mutate(x.id)}><Trash2 className="h-4 w-4" /></Button></td></tr>
              ))}</tbody>
            </table>
            {!m.measurements.length && <EmptyState title="Sin mediciones" />}
          </Card>
        </TabsContent>

        <TabsContent value="suscripciones" className="mt-5">
          <Card>
            <CardHeader title="Historial de suscripción" action={<Button size="sm" onClick={() => setDialog('subscription')}><Plus className="h-4 w-4" />Nueva</Button>} />
            <SimpleTable head={['Plan', 'Inicio', 'Fin', 'Precio', 'Estado']} rows={m.subscriptions.map((s) => [s.plan?.name, fmtDate(s.startDate), fmtDate(s.endDate), fmtMoney(s.price), <StatusBadge key={s.id} value={s.status} map={SUBSCRIPTION_STATUS} />])} />
          </Card>
        </TabsContent>

        <TabsContent value="pagos" className="mt-5">
          <Card>
            <CardHeader title="Pagos" action={<Button size="sm" onClick={() => setDialog('payment')}><Plus className="h-4 w-4" />Registrar</Button>} />
            <SimpleTable head={['Factura', 'Concepto', 'Fecha', 'Método', 'Monto', 'Estado']} rows={m.payments.map((p) => [<span key={p.id} className="font-mono text-[12px]">{p.invoiceNumber}</span>, p.concept, fmtDate(p.paidAt), PAYMENT_METHOD[p.method], <b key={`${p.id}a`}>{fmtMoney(p.amount)}</b>, <StatusBadge key={`${p.id}s`} value={p.status} map={PAYMENT_STATUS} />])} />
          </Card>
        </TabsContent>

        <TabsContent value="asistencia" className="mt-5">
          <Card>
            <CardHeader title="Últimas asistencias" description="Entradas y salidas registradas" />
            <SimpleTable head={['Fecha', 'Entrada', 'Salida', 'Método', 'Duración']} rows={m.attendance.map((a) => {
              const mins = a.checkOut ? Math.round((new Date(a.checkOut).getTime() - new Date(a.checkIn).getTime()) / 60000) : null;
              return [fmtDate(a.checkIn, 'EEE d MMM'), fmtTime(a.checkIn), a.checkOut ? fmtTime(a.checkOut) : <Badge key={a.id} tone="success" dot>Dentro</Badge>, ATTENDANCE_METHOD[a.method], mins !== null ? `${Math.floor(mins / 60)}h ${mins % 60}m` : '—'];
            })} />
          </Card>
        </TabsContent>

        <TabsContent value="reservas" className="mt-5">
          <Card>
            <CardHeader title="Reservas de clases" />
            <SimpleTable head={['Clase', 'Fecha', 'Estado', 'Pagado', 'Monto']} rows={m.bookings.map((b) => [<span key={b.id} className="inline-flex items-center gap-2"><ColorDot color={b.class?.color} />{b.class?.name}</span>, fmtDateTime(b.date), <StatusBadge key={`${b.id}s`} value={b.status} map={BOOKING_STATUS} />, b.paid ? 'Sí' : 'No', fmtMoney(b.amount)])} />
          </Card>
        </TabsContent>

        <TabsContent value="nutricion" className="mt-5">
          {nutrition?.some((d) => d.meals.length) ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {nutrition.filter((d) => d.meals.length).map((d) => (
                <Card key={d.dayOfWeek}>
                  <CardHeader title={DAYS_ES[d.dayOfWeek]} description={`${d.calories} kcal`} />
                  <CardBody className="pt-0 space-y-2">
                    {d.meals.map((meal: any) => (
                      <div key={meal.id} className="rounded-xl bg-surface-2/60 p-2.5"><p className="text-[11px] font-semibold uppercase tracking-wider text-ink-3">{MEAL_TYPE[meal.mealType]}</p><p className="text-[13px] text-ink">{meal.description}</p><p className="text-[11.5px] text-ink-3">{meal.calories} kcal · P {meal.protein}g · C {meal.carbs}g · G {meal.fats}g</p></div>
                    ))}
                  </CardBody>
                </Card>
              ))}
            </div>
          ) : <Card><EmptyState title="Sin plan nutricional" description="Asigna comidas desde Horario de nutrición." action={<Button variant="outline" onClick={() => navigate('/clases/nutricion')}>Ir a nutrición</Button>} /></Card>}
        </TabsContent>
      </Tabs>

      {/* Diálogos */}
      <Dialog open={dialog === 'edit'} onOpenChange={(o) => !o && setDialog(null)} title="Editar miembro" size="lg" footer={<><Button variant="ghost" onClick={() => setDialog(null)}>Cancelar</Button><Button type="submit" form="edit-member" loading={edit.isPending}>Guardar cambios</Button></>}>
        <AutoForm id="edit-member" fields={memberFields} defaultValues={memberToForm(m)} onSubmit={(v) => edit.mutate(v)} />
      </Dialog>
      <Dialog open={dialog === 'measure'} onOpenChange={(o) => !o && setDialog(null)} title="Agregar medición" size="sm" footer={<><Button variant="ghost" onClick={() => setDialog(null)}>Cancelar</Button><Button type="submit" form="measure-form" loading={addMeasure.isPending}>Guardar</Button></>}>
        <AutoForm id="measure-form" fields={measurementFields} defaultValues={{ type: 'WEIGHT' }} onSubmit={(v) => addMeasure.mutate(v)} columns={1} />
      </Dialog>
      <Dialog open={dialog === 'subscription'} onOpenChange={(o) => !o && setDialog(null)} title="Nueva suscripción" description="Se calculará la fecha de fin según la duración del plan." footer={<><Button variant="ghost" onClick={() => setDialog(null)}>Cancelar</Button><Button type="submit" form="sub-form" loading={addSub.isPending}>Registrar</Button></>}>
        <AutoForm id="sub-form" fields={subscriptionFields} defaultValues={{ planId: m.planId ?? '', registerPayment: true, paymentMethod: 'CASH' }} onSubmit={(v) => addSub.mutate(v)} />
      </Dialog>
      <Dialog open={dialog === 'payment'} onOpenChange={(o) => !o && setDialog(null)} title="Registrar pago" footer={<><Button variant="ghost" onClick={() => setDialog(null)}>Cancelar</Button><Button type="submit" form="pay-form" loading={addPay.isPending}>Registrar</Button></>}>
        <AutoForm id="pay-form" fields={paymentFields} defaultValues={{ concept: m.plan ? `Membresía ${m.plan.name}` : '', amount: m.plan?.price, method: 'CASH', status: 'PAID' }} onSubmit={(v) => addPay.mutate(v)} />
      </Dialog>
      <ConfirmDialog open={dialog === 'delete'} onOpenChange={(o) => !o && setDialog(null)} title="Eliminar miembro" description={`Se eliminará a ${name} con todo su historial. Esta acción no se puede deshacer.`} onConfirm={() => remove.mutate()} loading={remove.isPending} />
    </div>
  );
}

function SimpleTable({ head, rows }: { head: string[]; rows: React.ReactNode[][] }) {
  if (!rows.length) return <EmptyState title="Sin registros" />;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-[13.5px]">
        <thead><tr className="border-y border-line bg-surface-2/60 text-[11.5px] uppercase tracking-wider text-ink-3">{head.map((h) => <th key={h} className="px-5 py-2 text-left font-semibold whitespace-nowrap">{h}</th>)}</tr></thead>
        <tbody>{rows.map((r, i) => <tr key={i} className="border-b border-line last:border-0 hover:bg-surface-2/50">{r.map((c, j) => <td key={j} className="px-5 py-2.5 whitespace-nowrap">{c ?? '—'}</td>)}</tr>)}</tbody>
      </table>
    </div>
  );
}
