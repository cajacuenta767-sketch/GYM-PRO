import { Dumbbell, Layers } from 'lucide-react';
import { DIFFICULTY, toOptions } from '@/lib/labels';
import type { Exercise, ExerciseCategory } from '@/types';
import { CrudPage } from '@/components/crud-page';
import type { Column } from '@/components/data-table';
import type { FieldConfig } from '@/components/auto-form';
import { Badge, Select, StatusBadge, Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui';
import { useOptions } from '@/hooks/use-options';

const exerciseFields: FieldConfig[] = [
  { name: 'name', label: 'Nombre del ejercicio', required: true, placeholder: 'Crunch resistido' },
  { name: 'categoryId', label: 'Categoría', type: 'select', source: 'exerciseCategories' },
  { name: 'difficulty', label: 'Dificultad', type: 'select', options: toOptions(DIFFICULTY), required: true },
  { name: 'equipment', label: 'Equipo', placeholder: 'Mancuernas, barra, máquina…' },
  { name: 'sets', label: 'Series', type: 'number' },
  { name: 'reps', label: 'Repeticiones', type: 'number' },
  { name: 'restSeconds', label: 'Descanso (seg)', type: 'number' },
  { name: 'videoUrl', label: 'URL de video', type: 'url' },
  { name: 'imageUrl', label: 'Imagen', type: 'image' },
  { name: 'description', label: 'Técnica / descripción', type: 'textarea' },
];
const categoryFields: FieldConfig[] = [
  { name: 'name', label: 'Nombre', required: true, placeholder: 'Abdominales' },
  { name: 'muscleGroup', label: 'Grupo muscular', placeholder: 'Core, tren superior…' },
  { name: 'description', label: 'Descripción', type: 'textarea' },
];

const exerciseColumns: Column<Exercise>[] = [
  { key: 'name', header: 'Ejercicio', sortable: true, render: (e) => <div><p className="font-medium">{e.name}</p><p className="line-clamp-1 text-[12px] text-ink-3">{e.equipment ?? 'Sin equipo'}</p></div> },
  { key: 'category', header: 'Categoría', render: (e) => e.category ? <Badge tone="info">{e.category.name}</Badge> : '—' },
  { key: 'difficulty', header: 'Dificultad', sortable: true, render: (e) => <StatusBadge value={e.difficulty} map={DIFFICULTY} /> },
  { key: 'plan', header: 'Series × reps', render: (e) => e.sets ? <span className="tabular-nums">{e.sets} × {e.reps}{e.restSeconds ? <span className="text-ink-3"> · {e.restSeconds}s</span> : null}</span> : '—' },
  { key: 'videoUrl', header: 'Video', render: (e) => e.videoUrl ? <a href={e.videoUrl} target="_blank" rel="noreferrer" className="text-brand-ink hover:underline">Ver</a> : <span className="text-ink-3">—</span> },
];
const categoryColumns: Column<ExerciseCategory>[] = [
  { key: 'name', header: 'Categoría', sortable: true, render: (c) => <span className="font-medium">{c.name}</span> },
  { key: 'muscleGroup', header: 'Grupo muscular', render: (c) => c.muscleGroup ?? '—' },
  { key: 'description', header: 'Descripción', render: (c) => <span className="text-ink-2">{c.description ?? '—'}</span> },
  { key: 'count', header: 'Ejercicios', render: (c) => <Badge>{c._count?.exercises ?? 0}</Badge> },
];

export default function ExercisesPage() {
  const { data: cats } = useOptions('exerciseCategories');
  return (
    <Tabs defaultValue="ejercicios" className="animate-slide-up">
      <TabsList className="mb-5">
        <TabsTrigger value="ejercicios">Ejercicios</TabsTrigger>
        <TabsTrigger value="categorias">Categorías</TabsTrigger>
      </TabsList>
      <TabsContent value="ejercicios">
        <CrudPage<Exercise> eyebrow="Entrenamiento" title="Ejercicios" description="Biblioteca de ejercicios con técnica, series, repeticiones y dificultad." resource="/exercises" entityName="ejercicio" columns={exerciseColumns} fields={exerciseFields} emptyIcon={<Dumbbell />}
          toolbar={(c) => (
            <>
              <Select value={(c.filters.categoryId as string) ?? ''} onChange={(e) => c.setFilter('categoryId', e.target.value)} className="w-44"><option value="">Todas las categorías</option>{(cats ?? []).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</Select>
              <Select value={(c.filters.difficulty as string) ?? ''} onChange={(e) => c.setFilter('difficulty', e.target.value)} className="w-40"><option value="">Toda dificultad</option>{toOptions(DIFFICULTY).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</Select>
            </>
          )} />
      </TabsContent>
      <TabsContent value="categorias">
        <CrudPage<ExerciseCategory> eyebrow="Entrenamiento" title="Categorías de ejercicio" description="Agrupa los ejercicios por zona o grupo muscular." resource="/exercises/categories" entityName="categoría" columns={categoryColumns} fields={categoryFields} emptyIcon={<Layers />} />
      </TabsContent>
    </Tabs>
  );
}
