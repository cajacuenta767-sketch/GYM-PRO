import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ArrowRight, Check, Clock, MapPin, MessageCircle, Phone } from 'lucide-react';
import { get } from '@/lib/api';
import { DAYS_SHORT_ES, fmtDateTime, fmtMoney } from '@/lib/format';
import { Logo } from '@/components/layout/sidebar';
import { Skeleton } from '@/components/ui';

/** Página pública del gimnasio: planes, horario, eventos y contacto. */
export default function PublicPage() {
  const { data, isLoading } = useQuery({ queryKey: ['public', 'info'], queryFn: () => get<any>('/public/info') });
  const g = data?.gym ?? {};
  const wa = g.whatsappNumber ? `https://wa.me/${String(g.whatsappNumber).replace(/\D/g, '')}?text=${encodeURIComponent('Hola, quiero información sobre las membresías')}` : null;

  return (
    <div className="min-h-screen bg-bg">
      <header className="sticky top-0 z-30 border-b border-line bg-bg/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4 sm:px-6">
          <Logo className="h-8 w-8" /><span className="font-display text-[17px] font-bold">{g.gymName ?? 'GYM PRO'}</span>
          <nav className="ml-auto hidden items-center gap-6 text-[13.5px] font-medium text-ink-2 md:flex"><a href="#planes" className="hover:text-ink">Planes</a><a href="#horario" className="hover:text-ink">Horario</a><a href="#eventos" className="hover:text-ink">Eventos</a><a href="#contacto" className="hover:text-ink">Contacto</a></nav>
          <Link to="/login" className="ml-4 inline-flex h-9 items-center rounded-xl bg-side px-4 text-[13px] font-semibold text-side-ink">Acceder</Link>
        </div>
      </header>

      <section className="relative overflow-hidden bg-side text-side-ink">
        <div className="absolute inset-0 opacity-[0.35]" style={{ backgroundImage: 'radial-gradient(circle at 15% 30%, rgb(195 241 61 / 0.35), transparent 40%), radial-gradient(circle at 85% 80%, rgb(34 166 179 / 0.25), transparent 45%)' }} />
        <div className="relative mx-auto grid max-w-6xl gap-10 px-4 py-20 sm:px-6 lg:grid-cols-[1.2fr_1fr] lg:items-center">
          <div>
            <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-brand">{g.city ?? 'Tu ciudad'}</p>
            <h1 className="mt-3 font-display text-[44px] font-bold leading-[1.05] tracking-tight sm:text-[56px]">{g.slogan ?? 'Entrena. Supera. Repite.'}</h1>
            <p className="mt-5 max-w-lg text-[15.5px] leading-relaxed text-side-ink-2">Clases grupales, entrenadores certificados, seguimiento nutricional y acceso con código QR. Todo lo que necesitas para cumplir tus metas.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href="#planes" className="inline-flex h-11 items-center gap-2 rounded-xl bg-brand px-5 text-[14px] font-bold text-[#14161C]">Ver planes<ArrowRight className="h-4 w-4" /></a>
              {wa && <a href={wa} target="_blank" rel="noreferrer" className="inline-flex h-11 items-center gap-2 rounded-xl border border-white/20 px-5 text-[14px] font-semibold"><MessageCircle className="h-4 w-4" />Escríbenos por WhatsApp</a>}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[[data?.stats.members, 'miembros activos'], [data?.stats.classes, 'clases a la semana'], [data?.stats.trainers, 'entrenadores']].map(([v, l]) => <div key={String(l)} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4"><p className="font-display text-[28px] font-bold text-brand">{isLoading ? '…' : v}</p><p className="text-[12px] text-side-ink-2">{l}</p></div>)}
          </div>
        </div>
      </section>

      <section id="planes" className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <h2 className="font-display text-[28px] font-bold">Planes de membresía</h2>
        <p className="mt-1 text-[14px] text-ink-2">Elige el plan que se ajusta a tu ritmo. Todos incluyen acceso con QR y portal del miembro.</p>
        <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {isLoading ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-72 rounded-2xl" />) : data.plans.map((p: any) => (
            <div key={p.id} className="card flex flex-col overflow-hidden"><div className="h-2" style={{ background: p.color }} /><div className="flex-1 p-5"><h3 className="font-display text-[17px] font-semibold">{p.name}</h3><p className="text-[12.5px] text-ink-2">{p.durationDays} días</p><p className="kpi-number mt-3 text-[30px]">{fmtMoney(p.price, g.currency)}</p>{p.description && <p className="mt-2 text-[13px] text-ink-2">{p.description}</p>}<ul className="mt-4 space-y-1.5">{p.benefits.map((b: string) => <li key={b} className="flex items-start gap-2 text-[13px]"><Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-ink" />{b}</li>)}</ul></div><div className="border-t border-line p-4"><a href={wa ?? '#contacto'} className="block rounded-xl bg-side py-2.5 text-center text-[13px] font-semibold text-side-ink dark:bg-brand dark:text-[#14161C]">Quiero este plan</a></div></div>
          ))}
        </div>
      </section>

      <section id="horario" className="bg-surface-2/60 py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="font-display text-[28px] font-bold">Horario de clases</h2>
          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
            {[1, 2, 3, 4, 5, 6, 0].map((d) => { const slots = data?.schedule?.find((x: any) => x.dayOfWeek === d)?.slots ?? []; return (
              <div key={d} className="card p-3"><p className="mb-2 text-[12px] font-semibold uppercase tracking-wider text-ink-3">{DAYS_SHORT_ES[d]}</p>{slots.length === 0 ? <p className="text-[12px] text-ink-3">Sin clases</p> : <ul className="space-y-1.5">{slots.map((s: any) => <li key={s.scheduleId} className="rounded-lg px-2 py-1.5 text-[12px] font-medium text-white" style={{ background: s.color }}><span className="tabular-nums opacity-90">{s.startTime}</span> {s.name}</li>)}</ul>}</div>
            ); })}
          </div>
        </div>
      </section>

      {!!data?.events?.length && (
        <section id="eventos" className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <h2 className="font-display text-[28px] font-bold">Próximos eventos</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-3">{data.events.map((e: any) => <div key={e.id} className="card overflow-hidden"><div className="h-1.5" style={{ background: e.color }} /><div className="p-5"><p className="font-display text-[16px] font-semibold">{e.title}</p><p className="mt-1 text-[12.5px] text-ink-2">{fmtDateTime(e.startsAt)} · {e.location}</p>{e.description && <p className="mt-2 text-[13px] text-ink-2 line-clamp-3">{e.description}</p>}</div></div>)}</div>
        </section>
      )}

      <section id="contacto" className="border-t border-line bg-side py-14 text-side-ink">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 sm:px-6 md:grid-cols-3">
          <div><h3 className="font-display text-[18px] font-bold">{g.gymName}</h3><p className="mt-2 text-[13.5px] text-side-ink-2">{g.slogan}</p></div>
          <div className="space-y-2 text-[13.5px] text-side-ink-2"><p className="flex items-center gap-2"><MapPin className="h-4 w-4 text-brand" />{g.address}{g.city ? `, ${g.city}` : ''}</p><p className="flex items-center gap-2"><Phone className="h-4 w-4 text-brand" />{g.phone}</p><p className="flex items-center gap-2"><Clock className="h-4 w-4 text-brand" />{g.openingHours}</p></div>
          <div>{data?.branches?.length > 0 && <><p className="text-[11.5px] font-semibold uppercase tracking-wider text-side-ink-2">Sedes</p><ul className="mt-2 space-y-1.5 text-[13.5px]">{data.branches.map((b: any) => <li key={b.id}><b>{b.name}</b><span className="text-side-ink-2"> · {b.address}</span></li>)}</ul></>}</div>
        </div>
        <p className="mt-10 text-center text-[12px] text-side-ink-2">© {new Date().getFullYear()} {g.gymName} · Sistema GYM PRO</p>
      </section>
    </div>
  );
}
