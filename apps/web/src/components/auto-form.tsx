import { useEffect, useMemo } from 'react';
import { Controller, useForm, type FieldValues } from 'react-hook-form';
import { cn } from '@/lib/utils';
import { FieldError, Hint, Input, Label, Select, Switch, Textarea } from '@/components/ui';
import { useOptions, type Option, type OptionSource } from '@/hooks/use-options';
import { ImageUpload } from './image-upload';

export type FieldType = 'text' | 'email' | 'tel' | 'number' | 'password' | 'textarea' | 'select' | 'multiselect' | 'date' | 'datetime' | 'time' | 'switch' | 'color' | 'url' | 'image' | 'custom';

export interface FieldConfig {
  name: string;
  label: string;
  type?: FieldType;
  placeholder?: string;
  required?: boolean;
  hint?: string;
  options?: Option[];
  /** Carga de opciones desde la API (ver use-options). */
  source?: OptionSource;
  colSpan?: 1 | 2;
  min?: number; max?: number; step?: number;
  disabled?: boolean;
  /** Sección visual (título separador antes del campo). */
  section?: string;
  emptyOption?: string;
  /** Render propio para type: 'custom' (recibe valor y onChange). */
  render?: (value: any, onChange: (v: any) => void) => React.ReactNode;
}

interface AutoFormProps<T extends FieldValues> {
  fields: FieldConfig[];
  defaultValues?: Record<string, any>;
  onSubmit: (values: T) => void | Promise<void>;
  id?: string;
  className?: string;
  columns?: 1 | 2;
}

/**
 * Formulario generado desde una configuración declarativa.
 * El botón de envío vive fuera (footer del diálogo) y usa `form={id}`.
 */
export function AutoForm<T extends FieldValues>({ fields, defaultValues, onSubmit, id = 'auto-form', className, columns = 2 }: AutoFormProps<T>) {
  const defaults = useMemo(() => buildDefaults(fields, defaultValues), [fields, defaultValues]);
  const form = useForm<any>({ defaultValues: defaults });

  useEffect(() => { form.reset(defaults); }, [defaults]); // eslint-disable-line react-hooks/exhaustive-deps

  const submit = form.handleSubmit((values) => onSubmit(normalize(fields, values) as T));

  return (
    <form id={id} onSubmit={submit} className={cn('grid gap-x-4 gap-y-4', columns === 2 ? 'sm:grid-cols-2' : 'grid-cols-1', className)} noValidate>
      {fields.map((f) => (
        <FieldRenderer key={f.name} field={f} form={form} columns={columns} />
      ))}
    </form>
  );
}

function FieldRenderer({ field: f, form, columns }: { field: FieldConfig; form: ReturnType<typeof useForm<any>>; columns: number }) {
  const { data: remote } = useOptions(f.source);
  const options = f.options ?? remote ?? [];
  const error = form.formState.errors[f.name]?.message as string | undefined;
  const span = f.colSpan === 2 || f.type === 'textarea' || f.type === 'multiselect' || f.type === 'custom' || f.type === 'image' ? 'sm:col-span-2' : '';
  const rules = { required: f.required ? 'Este campo es obligatorio' : false };

  const control = (() => {
    switch (f.type) {
      case 'textarea':
        return <Textarea placeholder={f.placeholder} invalid={!!error} disabled={f.disabled} {...form.register(f.name, rules)} />;
      case 'select':
        return (
          <Select invalid={!!error} disabled={f.disabled} {...form.register(f.name, rules)}>
            <option value="">{f.emptyOption ?? (f.required ? 'Selecciona…' : 'Sin asignar')}</option>
            {options.map((o) => <option key={o.value} value={o.value}>{o.label}{o.hint ? ` · ${o.hint}` : ''}</option>)}
          </Select>
        );
      case 'multiselect':
        return (
          <Controller name={f.name} control={form.control} rules={rules} render={({ field }) => (
            <ChipMultiSelect options={options} value={field.value ?? []} onChange={field.onChange} />
          )} />
        );
      case 'image':
        return <Controller name={f.name} control={form.control} render={({ field }) => <ImageUpload value={field.value} onChange={field.onChange} />} />;
      case 'custom':
        return <Controller name={f.name} control={form.control} render={({ field }) => <>{f.render?.(field.value, field.onChange)}</>} />;
      case 'switch':
        return (
          <Controller name={f.name} control={form.control} render={({ field }) => (
            <div className="flex h-[38px] items-center gap-3">
              <Switch checked={!!field.value} onCheckedChange={field.onChange} disabled={f.disabled} />
              <span className="text-[13px] text-ink-2">{field.value ? 'Sí' : 'No'}</span>
            </div>
          )} />
        );
      case 'color':
        return (
          <Controller name={f.name} control={form.control} render={({ field }) => (
            <div className="flex items-center gap-2">
              <input type="color" value={field.value || '#C3F13D'} onChange={(e) => field.onChange(e.target.value)} className="h-[38px] w-12 cursor-pointer rounded-lg border border-line bg-surface p-1" />
              <Input value={field.value ?? ''} onChange={(e) => field.onChange(e.target.value)} placeholder="#C3F13D" className="font-mono" />
            </div>
          )} />
        );
      case 'number':
        return <Input type="number" step={f.step ?? 'any'} min={f.min} max={f.max} placeholder={f.placeholder} invalid={!!error} disabled={f.disabled} {...form.register(f.name, { ...rules, setValueAs: (v) => (v === '' || v === null ? undefined : Number(v)) })} />;
      case 'date':
        return <Input type="date" invalid={!!error} disabled={f.disabled} {...form.register(f.name, rules)} />;
      case 'datetime':
        return <Input type="datetime-local" invalid={!!error} disabled={f.disabled} {...form.register(f.name, rules)} />;
      case 'time':
        return <Input type="time" invalid={!!error} disabled={f.disabled} {...form.register(f.name, rules)} />;
      default:
        return <Input type={f.type ?? 'text'} placeholder={f.placeholder} invalid={!!error} disabled={f.disabled} autoComplete="off" {...form.register(f.name, rules)} />;
    }
  })();

  return (
    <>
      {f.section && (
        <div className={cn('pt-2', columns === 2 ? 'sm:col-span-2' : '')}>
          <p className="text-[11.5px] font-semibold uppercase tracking-[0.08em] text-ink-3 border-b border-line pb-2">{f.section}</p>
        </div>
      )}
      <div className={span}>
        <Label required={f.required}>{f.label}</Label>
        {control}
        <FieldError>{error}</FieldError>
        {!error && <Hint>{f.hint}</Hint>}
      </div>
    </>
  );
}

export function ChipMultiSelect({ options, value, onChange }: { options: Option[]; value: string[]; onChange: (v: string[]) => void }) {
  const toggle = (v: string) => onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v]);
  if (!options.length) return <p className="text-[13px] text-ink-3">Sin opciones disponibles.</p>;
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => {
        const active = value.includes(o.value);
        return (
          <button type="button" key={o.value} onClick={() => toggle(o.value)}
            className={cn('inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12.5px] font-medium transition-colors focus-ring',
              active ? 'border-transparent bg-side text-side-ink dark:bg-brand dark:text-[#14161C]' : 'border-line bg-surface text-ink-2 hover:border-line-strong hover:text-ink')}>
            {o.color && <span className="h-2 w-2 rounded-full" style={{ background: o.color }} />}
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

function buildDefaults(fields: FieldConfig[], values?: Record<string, any>) {
  const out: Record<string, any> = {};
  for (const f of fields) {
    const v = values?.[f.name];
    if (f.type === 'switch') out[f.name] = v ?? false;
    else if (f.type === 'multiselect') out[f.name] = Array.isArray(v) ? v : [];
    else if (f.type === 'custom') out[f.name] = v ?? null;
    else if (f.type === 'date') out[f.name] = v ? String(v).slice(0, 10) : '';
    else if (f.type === 'datetime') out[f.name] = v ? toLocalInput(v) : '';
    else out[f.name] = v ?? '';
  }
  return out;
}

function normalize(fields: FieldConfig[], values: Record<string, any>) {
  const out: Record<string, any> = {};
  for (const f of fields) {
    let v = values[f.name];
    if (f.type === 'custom') { out[f.name] = v; continue; }
    if (v === '' || v === undefined) { if (f.type === 'switch') v = false; else if (f.type === 'multiselect') v = []; else { out[f.name] = f.type === 'number' ? undefined : null; continue; } }
    if (f.type === 'datetime' && v) v = new Date(v).toISOString();
    if (f.type === 'date' && v) v = new Date(`${v}T12:00:00`).toISOString();
    out[f.name] = v;
  }
  return out;
}

function toLocalInput(v: string | Date) {
  const d = new Date(v);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
