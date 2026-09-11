import { useQuery } from '@tanstack/react-query';
import { get, list } from '@/lib/api';

export interface Option { value: string; label: string; color?: string; hint?: string }

/** Catálogos ligeros para selects: miembros, equipo, planes, clases, grupos… */
export const optionQueries = {
  members: () => list<any>('/members', { limit: 200, sortBy: 'firstName', sortDir: 'asc' }).then((r) => r.data.map((m) => ({ value: m.id, label: `${m.firstName} ${m.lastName}`, hint: m.code }))),
  staff: () => list<any>('/staff', { limit: 100, isActive: 'true' }).then((r) => r.data.map((s) => ({ value: s.id, label: `${s.firstName} ${s.lastName}`, hint: s.specialty ?? s.role }))),
  trainers: () => list<any>('/staff', { limit: 100, role: 'TRAINER' }).then((r) => r.data.map((s) => ({ value: s.id, label: `${s.firstName} ${s.lastName}` }))),
  nutritionists: () => list<any>('/staff', { limit: 100, role: 'NUTRITIONIST' }).then((r) => r.data.map((s) => ({ value: s.id, label: `${s.firstName} ${s.lastName}` }))),
  plans: () => list<any>('/memberships', { limit: 100 }).then((r) => r.data.map((p) => ({ value: p.id, label: p.name, color: p.color, hint: `${p.durationDays} días` }))),
  classes: () => list<any>('/classes', { limit: 100 }).then((r) => r.data.map((c) => ({ value: c.id, label: c.name, color: c.color }))),
  groups: () => list<any>('/groups', { limit: 100 }).then((r) => r.data.map((g) => ({ value: g.id, label: g.name, color: g.color }))),
  exerciseCategories: () => list<any>('/exercises/categories', { limit: 100 }).then((r) => r.data.map((c) => ({ value: c.id, label: c.name }))),
  productCategories: () => get<any[]>('/store/categories').then((r) => r.map((c) => ({ value: c.id, label: c.name }))),
  activityCategories: () => get<any[]>('/activities/categories').then((r) => r.map((c) => ({ value: c.name, label: c.name }))),
  roles: () => get<any[]>('/access/roles').then((r) => r.map((x) => ({ value: x.id, label: x.name }))),
  contacts: () => get<any[]>('/messages/contacts').then((r) => r.map((u) => ({ value: u.id, label: u.name, hint: u.email }))),
  branches: () => get<any[]>('/branches').then((r) => r.filter((b) => b.isActive).map((b) => ({ value: b.id, label: b.name, color: b.color }))),
  routineTemplates: () => list<any>('/routines', { limit: 100, isTemplate: 'true' }).then((r) => r.data.map((x) => ({ value: x.id, label: x.name, hint: x.level }))),
};

export type OptionSource = keyof typeof optionQueries;

export function useOptions(source?: OptionSource) {
  return useQuery<Option[]>({
    queryKey: ['options', source],
    queryFn: () => optionQueries[source!](),
    enabled: !!source,
    staleTime: 60_000,
  });
}
