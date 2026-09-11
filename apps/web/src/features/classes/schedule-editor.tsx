import { Plus, Trash2 } from 'lucide-react';
import { DAYS_ES } from '@/lib/format';
import { Button, Input, Select } from '@/components/ui';

export interface ScheduleValue { dayOfWeek: number; startTime: string; endTime: string }

/** Editor de horarios semanales para una clase (día + hora inicio + hora fin). */
export function ScheduleEditor({ value, onChange }: { value: ScheduleValue[] | null; onChange: (v: ScheduleValue[]) => void }) {
  const rows = value ?? [];
  const update = (i: number, patch: Partial<ScheduleValue>) => onChange(rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  return (
    <div className="space-y-2">
      {rows.map((r, i) => (
        <div key={i} className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-2">
          <Select value={r.dayOfWeek} onChange={(e) => update(i, { dayOfWeek: Number(e.target.value) })}>
            {[1, 2, 3, 4, 5, 6, 0].map((d) => <option key={d} value={d}>{DAYS_ES[d]}</option>)}
          </Select>
          <Input type="time" value={r.startTime} onChange={(e) => update(i, { startTime: e.target.value })} className="w-28" />
          <Input type="time" value={r.endTime} onChange={(e) => update(i, { endTime: e.target.value })} className="w-28" />
          <Button type="button" variant="ghost" size="icon-sm" className="text-danger-ink" onClick={() => onChange(rows.filter((_, idx) => idx !== i))}><Trash2 className="h-4 w-4" /></Button>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={() => onChange([...rows, { dayOfWeek: 1, startTime: '08:00', endTime: '09:00' }])}><Plus className="h-3.5 w-3.5" />Agregar horario</Button>
    </div>
  );
}
