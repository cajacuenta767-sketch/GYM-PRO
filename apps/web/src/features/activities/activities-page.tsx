import { Activity, Flame, Timer } from 'lucide-react';
import type { Activity as ActivityT } from '@/types';
import { CrudPage } from '@/components/crud-page';
import type { Column } from '@/components/data-table';
import type { FieldConfig } from '@/components/auto-form';
import { Avatar, Badge, Select } from '@/components/ui';
import { useOptions } from '@/hooks/use-options';

const fields: FieldConfig[] = [
  { name: 'name', label: 'Nombre de la actividad', required: true, placeholder: 'Pesos libres' },
  { name: 'category', label: 'Categoría', required: true, placeholder: 'Fuerza, Cardio, Abdominales…' },
  { name: 'trainerId', label: 'Entrenador', type: 'select', source: 'trainers' },
  { name: 'durationMin', label: 'Duración (min)', type: 'number' },
  { name: 'calories', label: 'Calorías aprox.', type: 'number' },
  { name: 'imageUrl', label: 'URL de imagen', type: 'url' },
  { name: 'description', label: 'Descripción', type: 'textarea' },
];

const columns: Column<ActivityT>[] = [
  { key: 'name', header: 'Actividad', sortable: true, render: (a) => <div><p className="font-medium">{a.name}</p><p className="line-clamp-1 text-[12px] text-ink-3">{a.description ?? ''}</p></div> },
  { key: 'category', header: 'Categoría', sortable: true, render: (a) => <Badge tone="brand">{a.category}</Badge> },
  { key: 'trainer', header: 'Entrenador', render: (a) => a.trainer ? <span className="inline-flex items-center gap-2"><Avatar name={`${a.trainer.firstName} ${a.trainer.lastName}`} src={a.trainer.photoUrl} size="xs" />{a.trainer.firstName} {a.trainer.lastName}</span> : '—' },
  { key: 'durationMin', header: 'Duración', render: (a) => a.durationMin ? <span className="inline-flex items-center gap-1 text-ink-2"><Timer className="h-3.5 w-3.5" />{a.durationMin} min</span> : '—' },
  { key: 'calories', header: 'Calorías', render: (a) => a.calories ? <span className="inline-flex items-center gap-1 text-ink-2"><Flame className="h-3.5 w-3.5 text-warning" />{a.calories} kcal</span> : '—' },
];

export default function ActivitiesPage() {
  const { data: cats } = useOptions('activityCategories');
  return (
    <CrudPage<ActivityT>
      eyebrow="Entrenamiento"
      title="Lista de actividades"
      description="Actividades disponibles en el gimnasio y el entrenador responsable de cada una."
      resource="/activities"
      entityName="actividad"
      createLabel="Agregar actividad"
      columns={columns}
      fields={fields}
      emptyIcon={<Activity />}
      toolbar={(c) => (
        <Select value={(c.filters.category as string) ?? ''} onChange={(e) => c.setFilter('category', e.target.value)} className="w-48">
          <option value="">Todas las categorías</option>
          {(cats ?? []).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </Select>
      )}
    />
  );
}
