import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { CalendarDays, ClipboardList, Dumbbell, MapPin, MessageCircle, Users, UserX } from 'lucide-react';
import { get } from '@/lib/api';
import { DAYS_SHORT_ES, fmtDate, fmtRelative, fmtTime } from '@/lib/format';
import { BOOKING_STATUS, MEMBER_STATUS } from '@/lib/labels';
import { Avatar, Badge, Card, CardBody, CardHeader, ColorDot, EmptyState, PageHeader, Skeleton, StatCard, StatusBadge } from '@/components/ui';

/** Vista personal del entrenador o integrante del equipo: clases de hoy, reservas y miembros a cargo. */
export default function AgendaPage() {
  const { data, isLoading, error } = useQuery({ queryKey: ['staff', 'agenda'], queryFn: () => get<any>('/staff/me/agenda'), retry: false });
  if (isLoading) return <div className="space-y-4"><Skeleton className="h-8 w-56" /><Skeleton className="h-28" /><Skeleton className="h-80" /></div>;
  if (error || !data) return <Card><EmptyState icon={<Users />} title="Tu cuenta no está vinculada a un integrante del equipo" description="Pide al administrador que asocie tu usuario a tu ficha de equipo para ver tu agenda." /></Card>;
  const today = new Date().getDay();
  return (
    <div className="animate-slide-up space-y-6">
      <PageHeader eyebrow="Mi espacio" title={`Hola, ${data.staff.name.split(' ')[0]}`} description={`${data.staff.specialty ?? data.staff.role}${data.staff.branch ? ` · ${data.staff.branch}` : ''} · ${fmtDate(new Date(), "EEEE d 'de' MMMM")}`} />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Clases de hoy" value={data.todayClasses.length} icon={<CalendarDays />} tone="brand" />
        <StatCard label="Reservas de hoy" value={data.stats.todayBookings} icon={<ClipboardList />} tone="info" />
        <StatCard label="Miembros a cargo" value={data.stats.members} icon={<Users />} tone="success" />
        <StatCard label="Sin venir hace 2 semanas" value={data.stats.inactiveMembers} icon={<UserX />} tone={data.stats.inactiveMembers ? 'warning' : 'neutral'} />
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.2fr_1fr]">
        <Card>
          <CardHeader title="Clases de hoy" description="Con las reservas confirmadas de cada sesión" />
          <CardBody className="pt-0 space-y-3">
            {data.todayClasses.length === 0 && <p className="py-6 text-center text-[13px] text-ink-3">No tienes clases programadas hoy.</p>}
            {data.todayClasses.map((c: any) => (
              <div key={`${c.classId}-${c.startTime}`} className="rounded-2xl border border-line p-4">
                <div className="flex items-start gap-3">
                  <div className="w-14 text-center"><p className="font-display text-[16px] font-bold leading-tight">{c.startTime}</p><p className="text-[11px] text-ink-3">{c.endTime}</p></div>
                  <span className="h-12 w-1.5 rounded-full" style={{ background: c.color }} />
                  <div className="min-w-0 flex-1"><p className="font-semibold">{c.name}</p><p className="inline-flex items-center gap-1 text-[12.5px] text-ink-2"><MapPin className="h-3.5 w-3.5" />{c.location ?? 'Sin ubicación'} · {c.enrolled}/{c.capacity} inscritos</p></div>
                  <Badge tone={c.bookings.length ? 'info' : 'neutral'}>{c.bookings.length} reservas</Badge>
                </div>
                {!!c.bookings.length && <ul className="mt-3 flex flex-wrap gap-2">{c.bookings.map((b: any) => <li key={b.id} className="inline-flex items-center gap-1.5 rounded-full border border-line px-2 py-1 text-[12px]"><Avatar name={`${b.member.firstName} ${b.member.lastName}`} src={b.member.photoUrl} size="xs" />{b.member.firstName} {b.member.lastName}<StatusBadge value={b.status} map={BOOKING_STATUS} /></li>)}</ul>}
              </div>
            ))}
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Mi semana" />
          <CardBody className="pt-0">
            <ul className="divide-y divide-line">
              {[1, 2, 3, 4, 5, 6, 0].map((d) => { const day = data.week.find((w: any) => w.dayOfWeek === d); return (
                <li key={d} className={`flex gap-3 py-2.5 ${d === today ? 'font-semibold' : ''}`}><span className={`w-10 shrink-0 text-[12px] uppercase tracking-wider ${d === today ? 'text-brand-ink' : 'text-ink-3'}`}>{DAYS_SHORT_ES[d]}</span><span className="flex flex-1 flex-wrap gap-1.5">{day?.slots.length ? day.slots.map((s: any, i: number) => <span key={i} className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11.5px] text-white" style={{ background: s.color }}>{s.startTime} {s.name}</span>) : <span className="text-[12px] text-ink-3">Libre</span>}</span></li>
              ); })}
            </ul>
          </CardBody>
        </Card>
      </div>
      <Card>
        <CardHeader title="Miembros a mi cargo" description="Contacto rápido, última visita y rutina asignada" icon={<Dumbbell />} action={<Link to="/rutinas" className="text-[12.5px] font-semibold text-brand-ink hover:underline">Rutinas</Link>} />
        <div className="overflow-x-auto"><table className="w-full text-[13.5px]">
          <thead><tr className="border-y border-line bg-surface-2/60 text-[11.5px] uppercase tracking-wider text-ink-3"><th className="px-5 py-2 text-left">Miembro</th><th className="px-5 py-2 text-left">Plan</th><th className="px-5 py-2 text-left">Estado</th><th className="px-5 py-2 text-left">Última visita</th><th className="px-5 py-2 text-left">Rutina</th><th className="px-3 py-2" /></tr></thead>
          <tbody>{data.members.map((m: any) => (
            <tr key={m.id} className="border-b border-line last:border-0 hover:bg-surface-2/50">
              <td className="px-5 py-2.5"><Link to={`/miembros/${m.id}`} className="flex items-center gap-2.5 hover:underline"><Avatar name={m.name} src={m.photoUrl} size="sm" /><span><span className="block font-medium">{m.name}</span><span className="block text-[11.5px] text-ink-3">{m.code}</span></span></Link></td>
              <td className="px-5 py-2.5">{m.plan ? <span className="inline-flex items-center gap-1.5"><ColorDot color={m.plan.color} />{m.plan.name}</span> : '—'}</td>
              <td className="px-5 py-2.5"><StatusBadge value={m.status} map={MEMBER_STATUS} /></td>
              <td className="px-5 py-2.5 text-ink-2">{m.lastVisit ? fmtRelative(m.lastVisit) : <span className="text-warning-ink">Nunca</span>}</td>
              <td className="px-5 py-2.5">{m.hasRoutine ? <Badge tone="success">Asignada</Badge> : <Badge tone="warning">Sin rutina</Badge>}</td>
              <td className="px-3 py-2.5 text-right"><Link to={`/miembros/${m.id}`} className="text-[12.5px] font-semibold text-brand-ink hover:underline">Ver ficha</Link></td>
            </tr>
          ))}</tbody>
        </table></div>
        {data.members.length === 0 && <EmptyState title="Sin miembros asignados" description="Asigna miembros a este entrenador desde su ficha." />}
      </Card>
      <p className="text-[12px] text-ink-3 inline-flex items-center gap-1"><MessageCircle className="h-3.5 w-3.5" />Desde la ficha de cada miembro puedes escribirle por WhatsApp. Última actualización {fmtTime(new Date())}.</p>
    </div>
  );
}
