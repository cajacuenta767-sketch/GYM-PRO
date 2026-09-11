import { useMemo, useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { list, type ListParams, type Paginated } from '@/lib/api';
import { useDebounce } from './use-debounce';

export interface ListState {
  page: number; limit: number; search: string; sortBy?: string; sortDir: 'asc' | 'desc'; filters: Record<string, unknown>;
}

/**
 * Estado de listado + consulta paginada contra la API.
 * Uso: const t = useList<Member>('/members', { limit: 20, filters: { status: 'ACTIVE' } })
 */
export function useList<T>(url: string, initial: Partial<ListState> = {}, extraKey: unknown[] = []) {
  const [state, setState] = useState<ListState>({ page: 1, limit: 10, search: '', sortDir: 'desc', filters: {}, ...initial });
  const search = useDebounce(state.search, 300);

  const params: ListParams = useMemo(
    () => ({ page: state.page, limit: state.limit, search, sortBy: state.sortBy, sortDir: state.sortDir, ...state.filters }),
    [state.page, state.limit, search, state.sortBy, state.sortDir, state.filters],
  );

  const query = useQuery<Paginated<T>>({
    queryKey: [url, params, ...extraKey],
    queryFn: () => list<T>(url, params),
    placeholderData: keepPreviousData,
  });

  return {
    ...state,
    query,
    rows: query.data?.data ?? [],
    meta: query.data?.meta ?? { total: 0, page: 1, limit: state.limit, pages: 1 },
    setPage: (page: number) => setState((s) => ({ ...s, page })),
    setLimit: (limit: number) => setState((s) => ({ ...s, limit, page: 1 })),
    setSearch: (search: string) => setState((s) => ({ ...s, search, page: 1 })),
    setSort: (sortBy: string) => setState((s) => ({ ...s, sortBy, sortDir: s.sortBy === sortBy && s.sortDir === 'asc' ? 'desc' : 'asc', page: 1 })),
    setFilter: (key: string, value: unknown) => setState((s) => ({ ...s, page: 1, filters: { ...s.filters, [key]: value } })),
    setFilters: (filters: Record<string, unknown>) => setState((s) => ({ ...s, page: 1, filters })),
  };
}

export type ListController<T> = ReturnType<typeof useList<T>>;
