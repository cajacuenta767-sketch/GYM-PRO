import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { CHART_COLORS } from '@/lib/labels';

const BRAND = '#7CB518';
const axis = { tickLine: false, axisLine: false, fontSize: 11.5 } as const;

export function ChartTooltip({ active, payload, label, formatter }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-line bg-surface px-3 py-2 shadow-pop text-[12.5px]">
      <p className="mb-1 font-semibold text-ink-2">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey ?? p.name} className="flex items-center gap-2 text-ink">
          <span className="h-2 w-2 rounded-full" style={{ background: p.color ?? p.fill }} />
          <span className="text-ink-2">{p.name}:</span>
          <b>{formatter ? formatter(p.value, p.dataKey) : p.value}</b>
        </p>
      ))}
    </div>
  );
}

export function AreaSeries({ data, x, y, name = 'Valor', color = BRAND, height = 220, formatter }: { data: any[]; x: string; y: string; name?: string; color?: string; height?: number; formatter?: (v: any) => string }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
        <defs>
          <linearGradient id={`grad-${y}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.28} />
            <stop offset="100%" stopColor={color} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis dataKey={x} {...axis} interval="preserveStartEnd" />
        <YAxis {...axis} width={48} tickFormatter={formatter} allowDecimals={false} />
        <Tooltip content={<ChartTooltip formatter={formatter} />} cursor={{ stroke: 'rgb(var(--line-strong))' }} />
        <Area type="monotone" dataKey={y} name={name} stroke={color} strokeWidth={2.2} fill={`url(#grad-${y})`} dot={false} activeDot={{ r: 4, strokeWidth: 0 }} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function BarSeries({ data, x, series, height = 240, stacked, formatter, radius = 6 }: { data: any[]; x: string; series: { key: string; name: string; color?: string }[]; height?: number; stacked?: boolean; formatter?: (v: any) => string; radius?: number }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }} barCategoryGap="28%">
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis dataKey={x} {...axis} interval="preserveStartEnd" />
        <YAxis {...axis} width={48} tickFormatter={formatter} allowDecimals={false} />
        <Tooltip content={<ChartTooltip formatter={formatter} />} cursor={{ fill: 'rgb(var(--surface-2))' }} />
        {series.map((s, i) => (
          <Bar key={s.key} dataKey={s.key} name={s.name} fill={s.color ?? CHART_COLORS[i % CHART_COLORS.length]} stackId={stacked ? 'a' : undefined} radius={stacked && i < series.length - 1 ? 0 : [radius, radius, 0, 0]} maxBarSize={38} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}

export function LineSeries({ data, x, series, height = 240, formatter }: { data: any[]; x: string; series: { key: string; name: string; color?: string }[]; height?: number; formatter?: (v: any) => string }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis dataKey={x} {...axis} interval="preserveStartEnd" />
        <YAxis {...axis} width={48} tickFormatter={formatter} allowDecimals={false} />
        <Tooltip content={<ChartTooltip formatter={formatter} />} />
        {series.map((s, i) => <Line key={s.key} type="monotone" dataKey={s.key} name={s.name} stroke={s.color ?? CHART_COLORS[i]} strokeWidth={2.2} dot={false} activeDot={{ r: 4, strokeWidth: 0 }} />)}
      </LineChart>
    </ResponsiveContainer>
  );
}

export function Donut({ data, height = 200, formatter, centerLabel, centerValue }: { data: { name: string; value: number; color?: string }[]; height?: number; formatter?: (v: any) => string; centerLabel?: string; centerValue?: React.ReactNode }) {
  const total = data.reduce((a, b) => a + b.value, 0);
  return (
    <div className="relative">
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" innerRadius="66%" outerRadius="92%" paddingAngle={2} stroke="none" cornerRadius={4}>
            {data.map((d, i) => <Cell key={d.name} fill={d.color ?? CHART_COLORS[i % CHART_COLORS.length]} />)}
          </Pie>
          <Tooltip content={<ChartTooltip formatter={formatter} />} />
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span className="kpi-number text-[22px] text-ink">{centerValue ?? total}</span>
        {centerLabel && <span className="text-[11px] text-ink-3">{centerLabel}</span>}
      </div>
    </div>
  );
}

export function Legend({ items }: { items: { name: string; value?: React.ReactNode; color?: string }[] }) {
  return (
    <ul className="space-y-2">
      {items.map((it, i) => (
        <li key={it.name} className="flex items-center gap-2.5 text-[12.5px]">
          <span className="h-2.5 w-2.5 rounded-sm" style={{ background: it.color ?? CHART_COLORS[i % CHART_COLORS.length] }} />
          <span className="flex-1 text-ink-2 truncate">{it.name}</span>
          {it.value !== undefined && <span className="font-semibold text-ink tabular-nums">{it.value}</span>}
        </li>
      ))}
    </ul>
  );
}
