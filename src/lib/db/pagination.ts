import type { Prisma } from '@prisma/client';

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  searchBy?: string[];
  searchValue?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    count: number;
    currentPage: number;
    perPage: number;
    totalPages: number;
    links: {
      self: string;
      first: string;
      last: string;
      next: string | null;
      prev: string | null;
    };
  };
}

export function buildPaginationLinks(
  baseUrl: string,
  params: PaginationParams,
  currentPage: number,
  totalPages: number
): PaginatedResponse<unknown>['pagination']['links'] {
  const buildUrl = (page: number) => {
    const queryParams = new URLSearchParams();
    queryParams.set('page', page.toString());
    queryParams.set('limit', (params.limit || 20).toString());
    if (params.sortBy) queryParams.set('sortBy', params.sortBy);
    if (params.sortOrder) queryParams.set('sortOrder', params.sortOrder);
    if (params.searchValue) queryParams.set('searchValue', params.searchValue);
    if (params.searchBy?.length) queryParams.set('searchBy', JSON.stringify(params.searchBy));
    return `${baseUrl}?${queryParams.toString()}`;
  };

  return {
    self: buildUrl(currentPage),
    first: buildUrl(1),
    last: buildUrl(totalPages),
    next: currentPage < totalPages ? buildUrl(currentPage + 1) : null,
    prev: currentPage > 1 ? buildUrl(currentPage - 1) : null,
  };
}

// Order by mapping function type
type OrderByFunction = (sortOrder: 'asc' | 'desc') => Prisma.Enumerable<unknown>;

export async function paginatedQuery<T>(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  model: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  where: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  include: any,
  params: PaginationParams,
  baseUrl: string,
  orderByMapping: Record<string, OrderByFunction> = {}
): Promise<PaginatedResponse<T>> {
  // Ensure page is always a valid positive number, defaulting to 1
  const page = Math.max(1, params.page ?? 1);
  const limit = Math.min(100, Math.max(1, params.limit ?? 20));
  const skip = (page - 1) * limit;
  
  // Debug logging to help diagnose pagination issues
  if (params.page !== undefined && params.page !== page) {
    console.warn('[Pagination] Page adjusted:', {
      requested: params.page,
      actual: page,
      reason: params.page < 1 ? 'below minimum' : 'other',
    });
  }

  // Build orderBy
  let orderBy: Prisma.Enumerable<unknown> = { createdAt: 'desc' };
  if (params.sortBy && orderByMapping[params.sortBy]) {
    orderBy = orderByMapping[params.sortBy](params.sortOrder || 'asc');
  }

  // Execute queries in parallel
  const [data, total] = await Promise.all([
    model.findMany({
      where,
      include,
      orderBy,
      skip,
      take: limit,
    }) as Promise<T[]>,
    model.count({ where }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return {
    data,
    pagination: {
      total,
      count: data.length,
      currentPage: page,
      perPage: limit,
      totalPages,
      links: buildPaginationLinks(baseUrl, params, page, totalPages),
    },
  };
}

