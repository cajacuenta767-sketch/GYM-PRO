import { PaginationDto } from '../dto/pagination.dto';

export interface Paginated<T> {
  data: T[];
  meta: { total: number; page: number; limit: number; pages: number };
}

interface PaginateOptions {
  where?: any;
  include?: any;
  select?: any;
  orderBy?: any;
  /** Campos de texto sobre los que aplica `search` (OR contains). */
  searchFields?: string[];
  /** Campos permitidos para `sortBy`. */
  sortable?: string[];
  defaultSort?: { [key: string]: 'asc' | 'desc' };
}

/**
 * Paginación genérica sobre cualquier delegado de Prisma.
 * Une búsqueda libre, ordenamiento seguro y conteo total en una sola llamada.
 */
export async function paginate<T>(
  delegate: { findMany: (args: any) => Promise<T[]>; count: (args: any) => Promise<number> },
  query: PaginationDto,
  options: PaginateOptions = {},
): Promise<Paginated<T>> {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(200, Math.max(1, Number(query.limit) || 10));
  const skip = (page - 1) * limit;

  const where: any = { ...(options.where ?? {}) };
  if (query.search && options.searchFields?.length) {
    const term = query.search.trim();
    if (term) {
      const or = options.searchFields.map((field) => buildContains(field, term));
      where.AND = [...(where.AND ?? []), { OR: or }];
    }
  }

  let orderBy: any = options.orderBy ?? options.defaultSort ?? { createdAt: 'desc' };
  if (query.sortBy && (!options.sortable || options.sortable.includes(query.sortBy))) {
    orderBy = buildOrderBy(query.sortBy, query.sortDir ?? 'desc');
  }

  const [data, total] = await Promise.all([
    delegate.findMany({
      where,
      include: options.include,
      select: options.select,
      orderBy,
      skip,
      take: limit,
    }),
    delegate.count({ where }),
  ]);

  return {
    data,
    meta: { total, page, limit, pages: Math.max(1, Math.ceil(total / limit)) },
  };
}

/** "trainer.firstName" → { trainer: { firstName: { contains } } } */
function buildContains(path: string, term: string): any {
  const parts = path.split('.');
  let node: any = { contains: term };
  for (let i = parts.length - 1; i >= 0; i--) node = { [parts[i]]: node };
  return node;
}

function buildOrderBy(path: string, dir: 'asc' | 'desc'): any {
  const parts = path.split('.');
  let node: any = dir;
  for (let i = parts.length - 1; i >= 0; i--) node = { [parts[i]]: node };
  return node;
}
