import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { QRCodeSVG } from 'qrcode.react';
import { AlertTriangle, ArrowRight, CalendarDays, ClipboardCheck, Flame, MapPin, Snowflake, Ticket } from 'lucide-react';
import { get } from '@/lib/api';
import { cn } from '@/lib/utils';
import { fmtDate, fmtDateTime } from '@/lib/format';
import { MEMBER_STATUS, NOTICE_TYPE } from '@/lib/labels';
import { Badge, Button, Card, CardBody, CardHeader, ProgressBar, Skeleton, StatusBadge } from '@/components/ui';

export default function PortalHomePage() {
  const { data, isLoading } = useQuery({ queryKey: ['portal', 'home'], queryFn: () => get<any>('/portal/home'), refetchInterval: 60_000 });
  if (isLoading || !data) return <div className="space-y-4"><Skeleton className="h-48" /><Skeleton className="h-32" /><Skeleton className="h-64" /></div>;
  const m = data.member, ms = data.membership;
  const urgent = ms.daysLeft !== null && ms.daysLeft <= 7;
  const hour = new Date().getHours();

  return (
    <div className="animate-slide-up space-y-5">
      <div>
        <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-ink-3">{fmtDate(new Date(), "EEEE, d 'de' MMMM")}</p>
        <h1 className="text-[24px] font-bold leading-tight">{hour < 12 ? 'Buenos días' : hour < 19 ? 'Buenas tardes' : 'Buenas noches'}, {m.firstName} 💪</h1>
      </div>

      {/* Carnet digital */}
      <div className="overflow-hidden rounded-3xl bg-side text-side-ink shadow-pop">
        <div className="grid gap-6 p-6 sm:grid-cols-[1fr_auto] sm:items-center">
          <div>
            <div className="flex flex-wrap items-center gap-2"><StatusBadge value={m.status} map={MEMBER_STATUS} />{ms.plan && <Badge tone="brand">{ms.plan.name}</Badge>}{ms.frozenUntil && new Date(ms.frozenUntil) > new Date() && <Badge tone="info"><Snowflake className="h-3 w-3" />Congelada hasta {fmtDate(ms.frozenUntil)}</Badge>}</div>
            <p className="mt-3 font-display text-[22px] font-bold leading-tight">{m.firstName} {m.lastName}</p>
            <p className="text-[13px] text-side-ink-2">Miembro {m.code}{m.branch ? ` · ${m.branch.name}` : ''}</p>
            {ms.expiresAt && (
              <div className="mt-4">
                <div className="flex items-center justify-between text-[12.5px]"><span className="text-side-ink-2">Vence el {fmtDate(ms.expiresAt)}</span><span className={cn('font-semibold', urgent ? 'text-[#FCA5A5]' : 'text-brand')}>{ms.daysLeft <= 0 ? 'Vencida' : `${ms.daysLeft} días restantes`}</span></div>
                <div className="mt-1.5"><ProgressBar value={ms.progress ?? 0} color={urgent ? '#F87171' : '#C3F13D'} size="sm" className="bg-white/10" /></div>
              </div>
            )}
            {urgent && <Link to="/portal/pagos" className="mt-4 inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2 text-[13px] font-bold text-[#14161C]">Renovar membresía<ArrowRight className="h-4 w-4" /></Link>}
          </div>
          <div className="flex flex-col items-center gap-2 rounded-2xl bg-white p-3 text-ink">
            <QRCodeSVG value={m.qrToken} size={132} level="M" />
            <span className="text-[11px] font-semibold text-ink-3">Muestra este código en la entrada</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[{ l: 'Visitas este mes', v: data.stats.visitsMonth, i: <ClipboardCheck /> }, { l: 'Visitas totales', v: data.stats.visitsTotal, i: <Flame /> }, { l: 'Último peso', v: data.stats.lastWeight ? `${data.stats.lastWeight} kg` : '—', i: <TrendingIcon /> }].map((s) => (
          <div key={s.l} className="card p-3.5"><span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-brand-soft text-brand-ink [&_svg]:h-4 [&_svg]:w-4">{s.i}</span><p className="kpi-number mt-2 text-[20px]">{s.v}</p><p className="text-[11.5px] text-ink-2">{s.l}</p></div>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader title="Tu próxima clase" icon={<Ticket />} action={<Link to="/portal/clases" className="text-[12.5px] font-semibold text-brand-ink hover:underline">Reservar</Link>} />
          <CardBody className="pt-0">
            {data.nextBooking ? (
              <div className="flex items-center gap-3 rounded-xl border border-line p-3">
                <span className="h-12 w-1.5 rounded-full" style={{ background: data.nextBooking.class.color }} />
                <div className="min-w-0 flex-1"><p className="font-semibold">{data.nextBooking.class.name}</p><p className="text-[12.5px] text-ink-2">{fmtDateTime(data.nextBooking.date)}</p><p className="inline-flex items-center gap-1 text-[12px] text-ink-3"><MapPin className="h-3 w-3" />{data.nextBooking.class.location}</p></div>
                {data.nextBooking.status === 'WAITLISTED' && <Badge tone="warning">Lista de espera</Badge>}
              </div>
            ) : <div className="rounded-xl border border-dashed border-line p-5 text-center text-[13px] text-ink-3">No tienes reservas próximas.<div className="mt-2"><Button size="sm" onClick={() => (window.location.href = '/portal/clases')}><CalendarDays className="h-4 w-4" />Ver horario</Button></div></div>}
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Avisos del gimnasio" icon={<AlertTriangle />} />
          <CardBody className="pt-0 space-y-2">
            {data.notices.length === 0 && <p className="text-[13px] text-ink-3">Sin avisos por ahora.</p>}
            {data.notices.map((n: any) => (
              <div key={n.id} className="rounded-xl bg-surface-2/60 p-3"><div className="flex items-center justify-between gap-2"><p className="truncate text-[13px] font-semibold">{n.title}</p><Badge tone={NOTICE_TYPE[n.type]?.tone}>{NOTICE_TYPE[n.type]?.label}</Badge></div><p className="mt-1 line-clamp-2 text-[12.5px] text-ink-2">{n.content}</p></div>
            ))}
          </CardBody>
        </Card>
      </div>

      {!!data.events.length && (
        <Card>
          <CardHeader title="Próximos eventos" action={<Link to="/portal/eventos" className="text-[12.5px] font-semibold text-brand-ink hover:underline">Ver todos</Link>} />
          <CardBody className="pt-0 grid gap-3 sm:grid-cols-3">
            {data.events.map((e: any) => (
              <div key={e.id} className="flex items-center gap-3 rounded-xl border border-line p-3">
                <span className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-xl text-white" style={{ background: e.color }}><span className="text-[9.5px] font-semibold uppercase leading-none">{fmtDate(e.startsAt, 'MMM')}</span><span className="font-display text-[16px] font-bold leading-tight">{fmtDate(e.startsAt, 'd')}</span></span>
                <div className="min-w-0"><p className="truncate text-[13px] font-semibold">{e.title}</p><p className="text-[12px] text-ink-3">{fmtDate(e.startsAt, 'HH:mm')} · {e.location}</p></div>
              </div>
            ))}
          </CardBody>
        </Card>
      )}
    </div>
  );
}

function TrendingIcon() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 17l6-6 4 4 8-8" /><path d="M14 7h7v7" /></svg>; }
