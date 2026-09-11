import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, ArrowRight, CalendarRange, ClipboardCheck, CreditCard, MessageCircle, Package, Sparkles, Ticket, Users, UsersRound, Wallet } from 'lucide-react';
import { waLink } from '@/lib/utils';
import { get } from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';
import { fmtDate, fmtMoney, fmtRelative, daysUntil } from '@/lib/format';
import { NOTICE_TYPE } from '@/lib/labels';
import { Avatar, Badge, Button, Card, CardBody, CardHeader, ProgressBar, Skeleton, StatCard } from '@/components/ui';
import { AreaSeries } from '@/components/charts';
import { DashboardCalendar } from './calendar';

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const { data, isLoading } = useQuery({ queryKey: ['dashboard', 'overview'], queryFn: () => get<any>('/dashboard/overview'), refetchInterval: 60_000 });
  const k = data?.kpis;
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Buenos días' : hour < 19 ? 'Buenas tardes' : 'Buenas noches';

  return (
    <div className="animate-slide-up space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-ink-3">{fmtDate(new Date(), "EEEE, d 'de' MMMM")}</p>
          <h1 className="text-[26px] font-bold leading-tight text-ink">{greeting}, {user?.name.split(' ')[0]} 👋</h1>
          <p className="mt-1 text-[13.5px] text-ink-2">Este es el pulso del gimnasio hoy.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate('/miembros?nuevo=1')}><Users className="h-4 w-4" />Nuevo miembro</Button>
          <Button onClick={() => navigate('/asistencia')}><ClipboardCheck className="h-4 w-4" />Registrar asistencia</Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {isLoading ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-[112px] rounded-2xl" />) : (
          <>
            <StatCard label="Miembros activos" value={k.members.active} hint={`${k.members.newThisMonth} nuevos este mes · ${k.members.value} en total`} trend={k.members.trend} icon={<Users />} tone="brand" onClick={() => navigate('/miembros')} />
            <StatCard label="Ingresos del mes" value={fmtMoney(k.revenue.value)} hint={`vs ${fmtMoney(k.revenue.prev)} mes anterior`} trend={k.revenue.trend} icon={<Wallet />} tone="success" onClick={() => navigate('/pagos')} />
            <StatCard label="Asistencia de hoy" value={k.attendanceToday.value} hint={`${k.attendanceToday.inside} personas dentro ahora`} icon={<ClipboardCheck />} tone="info" onClick={() => navigate('/asistencia')} />
            <StatCard label="Pagos pendientes" value={fmtMoney(k.pending.value)} hint={`${k.pending.count} facturas · ${k.bookingsToday.value} reservas hoy`} icon={<CreditCard />} tone={k.pending.count ? 'warning' : 'neutral'} onClick={() => navigate('/pagos?status=PENDING')} />
          </>
        )}
      </div>

      {/* Secundarios */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: 'Miembros del equipo', value: k?.staff.value, icon: <UsersRound />, to: '/equipo' },
          { label: 'Grupos', value: k?.groups.value, icon: <Sparkles />, to: '/grupos' },
          { label: 'Clases activas', value: k?.classes.value, icon: <CalendarRange />, to: '/clases' },
          { label: 'Reservas de hoy', value: k?.bookingsToday.value, icon: <Ticket />, to: '/clases/reservas' },
        ].map((s) => (
          <Link key={s.label} to={s.to} className="card flex items-center gap-3 px-4 py-3 transition-shadow hover:shadow-pop">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-surface-2 text-ink-2 [&_svg]:h-4 [&_svg]:w-4">{s.icon}</span>
            <span className="min-w-0"><span className="block text-[12px] text-ink-2 truncate">{s.label}</span><span className="kpi-number block text-[20px] leading-tight">{isLoading ? '…' : s.value}</span></span>
            <ArrowRight className="ml-auto h-4 w-4 text-ink-3" />
          </Link>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader title="Asistencia · últimos 14 días" description="Ingresos registrados por QR, tarjeta o manual" action={<Link to="/reportes" className="text-[12.5px] font-semibold text-brand-ink hover:underline">Ver reportes</Link>} />
          <CardBody>{isLoading ? <Skeleton className="h-[220px]" /> : <AreaSeries data={data.attendanceSeries} x="label" y="count" name="Asistencias" />}</CardBody>
        </Card>
        <Card>
          <CardHeader title="Afiliación" description="Miembros por tipo de membresía" action={<Link to="/membresias" className="text-[12.5px] font-semibold text-brand-ink hover:underline">Planes</Link>} />
          <CardBody className="space-y-4">
            {isLoading ? <Skeleton className="h-40" /> : data.plans.map((p: any) => {
              const total = data.plans.reduce((a: number, b: any) => a + b.members, 0) || 1;
              return (
                <div key={p.id}>
                  <div className="mb-1.5 flex items-center justify-between text-[13px]">
                    <span className="flex items-center gap-2 font-medium text-ink"><span className="h-2.5 w-2.5 rounded-full" style={{ background: p.color }} />{p.name}</span>
                    <span className="text-ink-2"><b className="text-ink">{p.members}</b> · {Math.round((p.members / total) * 100)}%</span>
                  </div>
                  <ProgressBar value={(p.members / total) * 100} color={p.color} size="sm" />
                </div>
              );
            })}
          </CardBody>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2"><DashboardCalendar /></div>
        <div className="space-y-6">
          <Card>
            <CardHeader title="Vencen esta semana" description="Membresías por renovar" icon={<AlertTriangle />} action={<Link to="/suscripciones" className="text-[12.5px] font-semibold text-brand-ink hover:underline">Ver</Link>} />
            <CardBody className="pt-0">
              {isLoading ? <Skeleton className="h-40" /> : data.expiringSoon.length === 0 ? <p className="py-4 text-center text-[13px] text-ink-3">Sin vencimientos próximos. 🎉</p> : (
                <ul className="divide-y divide-line">
                  {data.expiringSoon.map((m: any) => {
                    const d = daysUntil(m.expiresAt) ?? 0;
                    return (
                      <li key={m.id} className="flex items-center gap-3 py-2.5">
                        <Avatar name={`${m.firstName} ${m.lastName}`} src={m.photoUrl} size="sm" />
                        <Link to={`/miembros/${m.id}`} className="min-w-0 flex-1">
                          <span className="block truncate text-[13px] font-medium text-ink hover:underline">{m.firstName} {m.lastName}</span>
                          <span className="block text-[11.5px] text-ink-3">{m.plan?.name} · {m.code}</span>
                        </Link>
                        <Badge tone={d <= 2 ? 'danger' : 'warning'}>{d <= 0 ? 'Hoy' : `${d} d`}</Badge>
                        {waLink(m.phone) && <a href={waLink(m.phone, `Hola ${m.firstName}, tu membresía vence el ${fmtDate(m.expiresAt)}. ¿Te ayudamos a renovarla?`)!} target="_blank" rel="noreferrer" aria-label="WhatsApp" className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-[#128C7E] hover:bg-success-soft"><MessageCircle className="h-4 w-4" /></a>}
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardBody>
          </Card>
          <Card>
            <CardHeader title="Lista de grupos" action={<Link to="/grupos" className="text-[12.5px] font-semibold text-brand-ink hover:underline">Todos</Link>} />
            <CardBody className="pt-0">
              <ul className="divide-y divide-line">
                {(data?.groups ?? []).map((g: any) => (
                  <li key={g.id} className="flex items-center gap-3 py-2.5">
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-[12px] font-bold text-white" style={{ background: g.color }}>{g.name[0]}</span>
                    <span className="flex-1 text-[13px] font-medium text-ink">{g.name}</span>
                    <span className="text-[12px] text-ink-2">{g.members} miembros</span>
                  </li>
                ))}
              </ul>
            </CardBody>
          </Card>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader title="Últimos pagos" action={<Link to="/pagos" className="text-[12.5px] font-semibold text-brand-ink hover:underline">Ver todos</Link>} />
          <CardBody className="pt-0">
            <ul className="divide-y divide-line">
              {(data?.recentPayments ?? []).map((p: any) => (
                <li key={p.id} className="flex items-center gap-3 py-2.5">
                  <Avatar name={`${p.member.firstName} ${p.member.lastName}`} src={p.member.photoUrl} size="sm" />
                  <span className="min-w-0 flex-1"><span className="block truncate text-[13px] font-medium">{p.member.firstName} {p.member.lastName}</span><span className="block truncate text-[11.5px] text-ink-3">{p.concept} · {fmtRelative(p.paidAt)}</span></span>
                  <span className="text-[13px] font-semibold tabular-nums text-success-ink">+{fmtMoney(p.amount)}</span>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Próximos eventos" action={<Link to="/eventos" className="text-[12.5px] font-semibold text-brand-ink hover:underline">Agenda</Link>} />
          <CardBody className="pt-0">
            <ul className="divide-y divide-line">
              {(data?.upcomingEvents ?? []).map((e: any) => (
                <li key={e.id} className="flex items-center gap-3 py-2.5">
                  <span className="flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-xl text-white" style={{ background: e.color }}>
                    <span className="text-[9.5px] font-semibold uppercase leading-none">{fmtDate(e.startsAt, 'MMM')}</span>
                    <span className="font-display text-[15px] font-bold leading-tight">{fmtDate(e.startsAt, 'd')}</span>
                  </span>
                  <span className="min-w-0 flex-1"><span className="block truncate text-[13px] font-medium">{e.title}</span><span className="block truncate text-[11.5px] text-ink-3">{fmtDate(e.startsAt, 'HH:mm')} · {e.location}</span></span>
                </li>
              ))}
              {data && data.upcomingEvents.length === 0 && <li className="py-4 text-center text-[13px] text-ink-3">Sin eventos próximos.</li>}
            </ul>
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Avisos y alertas" icon={<Package />} />
          <CardBody className="pt-0 space-y-2">
            {(data?.notices ?? []).slice(0, 3).map((n: any) => (
              <div key={n.id} className="rounded-xl border border-line bg-surface-2/50 p-3">
                <div className="flex items-center justify-between gap-2"><p className="truncate text-[13px] font-semibold">{n.title}</p><Badge tone={NOTICE_TYPE[n.type]?.tone}>{NOTICE_TYPE[n.type]?.label}</Badge></div>
                <p className="mt-1 line-clamp-2 text-[12px] text-ink-2">{n.content}</p>
              </div>
            ))}
            {!!data?.lowStock?.length && (
              <div className="rounded-xl border border-warning/30 bg-warning-soft p-3">
                <p className="text-[12.5px] font-semibold text-warning-ink">Stock bajo en tienda</p>
                <ul className="mt-1 space-y-0.5 text-[12px] text-warning-ink/90">{data.lowStock.map((p: any) => <li key={p.id} className="flex justify-between"><span className="truncate">{p.name}</span><b>{p.stock} u.</b></li>)}</ul>
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
