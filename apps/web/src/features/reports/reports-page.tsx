import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Download, PieChart, TrendingUp, Users, Wallet, ClipboardCheck, CalendarClock } from 'lucide-react';
import { get } from '@/lib/api';
import { fmtMoney, fmtNumber } from '@/lib/format';
import { CHART_COLORS, MEMBER_STATUS } from '@/lib/labels';
import { Badge, Button, Card, CardBody, CardHeader, Input, PageHeader, ProgressBar, Select, Skeleton, StatCard, Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui';
import { PAYMENT_METHOD } from '@/lib/labels';
import { fmtTime, toInputDate } from '@/lib/format';
import { AreaSeries, BarSeries, Donut, Legend, LineSeries } from '@/components/charts';
import { exportXlsx } from '@/lib/export';

export default function ReportsPage() {
  const [months, setMonths] = useState(12);
  const [days, setDays] = useState(30);
  const [cashDate, setCashDate] = useState(toInputDate(new Date()));
  const cash = useQuery({ queryKey: ['reports', 'cash', cashDate], queryFn: () => get<any>('/reports/cash', { date: cashDate }) });
  const summary = useQuery({ queryKey: ['reports', 'summary'], queryFn: () => get<any>('/reports/summary') });
  const revenue = useQuery({ queryKey: ['reports', 'revenue', months], queryFn: () => get<any>('/reports/revenue', { months }) });
  const members = useQuery({ queryKey: ['reports', 'members', months], queryFn: () => get<any>('/reports/members', { months }) });
  const attendance = useQuery({ queryKey: ['reports', 'attendance', days], queryFn: () => get<any>('/reports/attendance', { days }) });
  const classes = useQuery({ queryKey: ['reports', 'classes'], queryFn: () => get<any[]>('/reports/classes') });
  const store = useQuery({ queryKey: ['reports', 'store'], queryFn: () => get<any[]>('/reports/store') });
  const s = summary.data;

  const exportCsv = (rows: any[], name: string) => {
    if (!rows?.length) return;
    const keys = Object.keys(rows[0]);
    const csv = [keys.join(','), ...rows.map((r) => keys.map((k) => JSON.stringify(r[k] ?? '')).join(','))].join('\n');
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); a.download = `${name}.csv`; a.click();
  };

  return (
    <div className="animate-slide-up space-y-6">
      <PageHeader eyebrow="Operación" title="Reportes" description="Indicadores de negocio: ingresos, crecimiento de miembros, asistencia, clases y tienda." actions={
        <div className="flex items-center gap-2">
          <Select value={months} onChange={(e) => setMonths(Number(e.target.value))} className="w-36"><option value={6}>Últimos 6 meses</option><option value={12}>Últimos 12 meses</option><option value={24}>Últimos 24 meses</option></Select>
          <Button variant="outline" onClick={() => exportCsv(revenue.data?.series, 'ingresos')}><Download className="h-4 w-4" />CSV</Button>
          <Button onClick={() => exportXlsx('reporte-gympro', [{ name: 'Ingresos', rows: revenue.data?.series ?? [] }, { name: 'Miembros', rows: members.data?.growth ?? [] }, { name: 'Por plan', rows: members.data?.byPlan ?? [] }, { name: 'Asistencia', rows: attendance.data?.daily ?? [] }, { name: 'Clases', rows: classes.data ?? [] }, { name: 'Tienda', rows: store.data ?? [] }])}><Download className="h-4 w-4" />Exportar Excel</Button>
        </div>
      } />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-6">
        <StatCard label="Miembros" value={s?.members ?? '…'} icon={<Users />} tone="neutral" />
        <StatCard label="Activos" value={s?.activeMembers ?? '…'} icon={<Users />} tone="success" />
        <StatCard label="Retención" value={s ? `${s.retention}%` : '…'} icon={<TrendingUp />} tone="brand" />
        <StatCard label="Ingresos del mes" value={fmtMoney(s?.revenueMonth)} icon={<Wallet />} tone="success" />
        <StatCard label="Asistencias del mes" value={s ? fmtNumber(s.attendanceMonth) : '…'} icon={<ClipboardCheck />} tone="info" />
        <StatCard label="Vencen en 30 días" value={s?.expiring30 ?? '…'} icon={<CalendarClock />} tone="warning" />
      </div>

      <Tabs defaultValue="ingresos">
        <TabsList className="flex-wrap"><TabsTrigger value="ingresos">Ingresos</TabsTrigger><TabsTrigger value="miembros">Miembros</TabsTrigger><TabsTrigger value="asistencia">Asistencia</TabsTrigger><TabsTrigger value="clases">Clases</TabsTrigger><TabsTrigger value="tienda">Tienda</TabsTrigger><TabsTrigger value="caja">Caja del día</TabsTrigger></TabsList>

        <TabsContent value="ingresos" className="mt-5 grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader title="Ingresos mensuales" description="Membresías vs. ventas de tienda" />
            <CardBody>{revenue.data ? <BarSeries data={revenue.data.series} x="label" series={[{ key: 'memberships', name: 'Membresías', color: '#7CB518' }, { key: 'store', name: 'Tienda', color: '#22A6B3' }]} stacked height={300} formatter={(v) => fmtMoney(v)} /> : <Skeleton className="h-[300px]" />}</CardBody>
          </Card>
          <div className="space-y-4">
            <Card><CardBody className="pt-5"><p className="text-[12.5px] text-ink-2">Total del periodo</p><p className="kpi-number text-[30px]">{fmtMoney(revenue.data?.total)}</p><p className="text-[12px] text-ink-3">Promedio mensual {fmtMoney(revenue.data?.average)}</p></CardBody></Card>
            <Card><CardHeader title="Tendencia" /><CardBody className="pt-0">{revenue.data && <AreaSeries data={revenue.data.series} x="label" y="total" name="Total" height={140} formatter={(v) => fmtMoney(v)} />}</CardBody></Card>
          </div>
        </TabsContent>

        <TabsContent value="miembros" className="mt-5 grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2"><CardHeader title="Altas de miembros por mes" /><CardBody>{members.data ? <LineSeries data={members.data.growth} x="label" series={[{ key: 'count', name: 'Nuevos miembros', color: '#7C5CFC' }]} height={280} /> : <Skeleton className="h-[280px]" />}</CardBody></Card>
          <div className="space-y-6">
            <Card><CardHeader title="Por plan" /><CardBody className="pt-0">{members.data && <><Donut data={members.data.byPlan.map((p: any) => ({ name: p.plan, value: p.count, color: p.color }))} height={160} centerLabel="miembros" /><Legend items={members.data.byPlan.map((p: any) => ({ name: p.plan, value: p.count, color: p.color }))} /></>}</CardBody></Card>
            <Card><CardHeader title="Por estado" /><CardBody className="pt-0 space-y-2">{members.data?.byStatus.map((x: any, i: number) => { const total = members.data.byStatus.reduce((a: number, b: any) => a + b.count, 0); return <div key={x.status}><div className="mb-1 flex justify-between text-[12.5px]"><span>{MEMBER_STATUS[x.status]?.label ?? x.status}</span><b>{x.count}</b></div><ProgressBar value={(x.count / total) * 100} color={CHART_COLORS[i]} size="sm" /></div>; })}</CardBody></Card>
          </div>
        </TabsContent>

        <TabsContent value="asistencia" className="mt-5 space-y-6">
          <div className="flex items-center gap-2"><Select value={days} onChange={(e) => setDays(Number(e.target.value))} className="w-36"><option value={14}>14 días</option><option value={30}>30 días</option><option value={90}>90 días</option></Select><span className="text-[13px] text-ink-2">Promedio diario <b className="text-ink">{attendance.data?.dailyAverage ?? '…'}</b> · estancia media <b className="text-ink">{attendance.data?.averageStayMinutes ?? '…'} min</b></span></div>
          <Card><CardHeader title="Asistencias por día" /><CardBody>{attendance.data ? <AreaSeries data={attendance.data.daily.map((d: any) => ({ ...d, label: d.date.slice(5) }))} x="label" y="count" name="Asistencias" height={240} /> : <Skeleton className="h-[240px]" />}</CardBody></Card>
          <div className="grid gap-6 lg:grid-cols-2">
            <Card><CardHeader title="Horas pico" description="Ingresos por hora del día" /><CardBody>{attendance.data && <BarSeries data={attendance.data.byHour} x="hour" series={[{ key: 'count', name: 'Ingresos', color: '#F5875C' }]} height={220} />}</CardBody></Card>
            <Card><CardHeader title="Por día de la semana" /><CardBody>{attendance.data && <BarSeries data={attendance.data.byWeekday} x="day" series={[{ key: 'count', name: 'Ingresos', color: '#22A6B3' }]} height={220} />}</CardBody></Card>
          </div>
        </TabsContent>

        <TabsContent value="clases" className="mt-5">
          <Card>
            <CardHeader title="Rendimiento de clases" description="Reservas acumuladas y ocupación de inscritos frente a la capacidad" action={<Button variant="outline" size="sm" onClick={() => exportCsv(classes.data ?? [], 'clases')}><Download className="h-3.5 w-3.5" />CSV</Button>} />
            <div className="overflow-x-auto"><table className="w-full text-[13.5px]"><thead><tr className="border-y border-line bg-surface-2/60 text-[11.5px] uppercase tracking-wider text-ink-3"><th className="px-5 py-2 text-left">Clase</th><th className="px-5 py-2 text-left">Instructor</th><th className="px-5 py-2 text-right">Reservas</th><th className="px-5 py-2 text-right">Inscritos</th><th className="px-5 py-2 text-left w-56">Ocupación</th></tr></thead><tbody>{classes.data?.map((c) => <tr key={c.id} className="border-b border-line last:border-0"><td className="px-5 py-2.5 font-medium"><span className="mr-2 inline-block h-2.5 w-2.5 rounded-full" style={{ background: c.color }} />{c.name}</td><td className="px-5 py-2.5 text-ink-2">{c.trainer ?? '—'}</td><td className="px-5 py-2.5 text-right font-semibold">{c.bookings}</td><td className="px-5 py-2.5 text-right">{c.enrolled} / {c.capacity}</td><td className="px-5 py-2.5"><div className="flex items-center gap-2"><ProgressBar value={c.occupancy} color={c.color} size="sm" /><span className="w-10 text-right text-[12px] text-ink-2">{c.occupancy}%</span></div></td></tr>)}</tbody></table></div>
          </Card>
        </TabsContent>

        <TabsContent value="tienda" className="mt-5 grid gap-6 lg:grid-cols-2">
          <Card><CardHeader title="Productos más vendidos" description="Por ingresos" /><CardBody>{store.data ? <BarSeries data={store.data.slice(0, 8).map((p) => ({ ...p, name: p.product.length > 18 ? p.product.slice(0, 18) + '…' : p.product }))} x="name" series={[{ key: 'total', name: 'Ingresos', color: '#7CB518' }]} height={280} formatter={(v) => fmtMoney(v)} /> : <Skeleton className="h-[280px]" />}</CardBody></Card>
          <Card><CardHeader title="Detalle" icon={<PieChart />} /><div className="overflow-x-auto"><table className="w-full text-[13.5px]"><thead><tr className="border-y border-line bg-surface-2/60 text-[11.5px] uppercase tracking-wider text-ink-3"><th className="px-5 py-2 text-left">Producto</th><th className="px-5 py-2 text-right">Unidades</th><th className="px-5 py-2 text-right">Ingresos</th><th className="px-5 py-2 text-right">Stock</th></tr></thead><tbody>{store.data?.map((p) => <tr key={p.product} className="border-b border-line last:border-0"><td className="px-5 py-2.5 font-medium">{p.product}</td><td className="px-5 py-2.5 text-right">{p.quantity}</td><td className="px-5 py-2.5 text-right font-semibold">{fmtMoney(p.total)}</td><td className="px-5 py-2.5 text-right text-ink-2">{p.stock}</td></tr>)}</tbody></table></div></Card>
        </TabsContent>
        <TabsContent value="caja" className="mt-5 space-y-5">
          <div className="flex flex-wrap items-center gap-3"><Input type="date" value={cashDate} onChange={(e) => setCashDate(e.target.value)} className="w-44" /><Button variant="outline" size="sm" onClick={() => exportCsv(cash.data?.movements?.map((m: any) => ({ ...m, at: fmtTime(m.at) })) ?? [], `caja-${cashDate}`)}><Download className="h-3.5 w-3.5" />CSV</Button><Button variant="outline" size="sm" onClick={() => window.print()}>Imprimir cierre</Button></div>
          {cash.data && (
            <>
              <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                <StatCard label="Total del día" value={fmtMoney(cash.data.total)} icon={<Wallet />} tone="success" />
                <StatCard label="Membresías" value={fmtMoney(cash.data.memberships)} icon={<Users />} tone="brand" />
                <StatCard label="Tienda" value={fmtMoney(cash.data.store)} icon={<PieChart />} tone="info" />
                <StatCard label="Movimientos" value={cash.data.count} icon={<ClipboardCheck />} tone="neutral" />
              </div>
              <div className="grid gap-5 lg:grid-cols-[320px_1fr]">
                <Card><CardHeader title="Por método de pago" /><CardBody className="pt-0"><ul className="divide-y divide-line">{cash.data.byMethod.map((m: any) => <li key={m.method} className="flex items-center justify-between py-2.5 text-[13.5px]"><span><Badge>{PAYMENT_METHOD[m.method] ?? m.method}</Badge><span className="ml-2 text-[11.5px] text-ink-3">{fmtMoney(m.memberships)} + {fmtMoney(m.store)}</span></span><b className="tabular-nums">{fmtMoney(m.total)}</b></li>)}{cash.data.byMethod.length === 0 && <li className="py-6 text-center text-[13px] text-ink-3">Sin movimientos este día.</li>}</ul></CardBody></Card>
                <Card><CardHeader title="Movimientos" description={`Cobros y ventas del ${cashDate}`} /><div className="overflow-x-auto"><table className="w-full text-[13px]"><thead><tr className="border-y border-line bg-surface-2/60 text-[11.5px] uppercase tracking-wider text-ink-3"><th className="px-4 py-2 text-left">Hora</th><th className="px-4 py-2 text-left">Ref.</th><th className="px-4 py-2 text-left">Quién</th><th className="px-4 py-2 text-left">Concepto</th><th className="px-4 py-2 text-left">Método</th><th className="px-4 py-2 text-right">Monto</th></tr></thead><tbody>{cash.data.movements.map((m: any) => <tr key={m.ref} className="border-b border-line last:border-0"><td className="px-4 py-2 tabular-nums">{fmtTime(m.at)}</td><td className="px-4 py-2 font-mono text-[12px]">{m.ref}</td><td className="px-4 py-2">{m.who}</td><td className="px-4 py-2 text-ink-2 max-w-[260px] truncate">{m.concept}</td><td className="px-4 py-2">{PAYMENT_METHOD[m.method] ?? m.method}</td><td className="px-4 py-2 text-right font-semibold tabular-nums">{fmtMoney(m.amount)}</td></tr>)}</tbody></table></div></Card>
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
