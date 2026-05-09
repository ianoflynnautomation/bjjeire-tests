import type { APIRequestContext } from '@playwright/test';
import { getTyped } from './http';
import { DEFAULT_PAGE, DEFAULT_PAGE_SIZE, type PaginationQuery } from './pagination';
import type { PaginatedResponse } from './common-contracts';

type QueryScalar = string | number | boolean | undefined;

export type ListReader<TQuery extends PaginationQuery, TDto> = (
  request: APIRequestContext,
  query?: TQuery,
) => Promise<PaginatedResponse<TDto>>;

export type ListReaderConfig<TQuery extends PaginationQuery> = Readonly<{
  route: string;
  defaults?: Readonly<Partial<TQuery>>;
}>;

export function createListReader<TQuery extends PaginationQuery, TDto>(
  config: ListReaderConfig<TQuery>,
): ListReader<TQuery, TDto> {
  return (request, query) => {
    const merged = { ...config.defaults, ...query } as TQuery;
    const params: Record<string, QueryScalar> = {
      page: merged.page ?? DEFAULT_PAGE,
      pageSize: merged.pageSize ?? DEFAULT_PAGE_SIZE,
    };

    for (const [key, value] of Object.entries(merged)) {
      if (key === 'page' || key === 'pageSize') continue;
      if (isQueryScalar(value)) {
        params[key] = value;
      }
    }

    return getTyped<PaginatedResponse<TDto>>(request, config.route, { params });
  };
}

function isQueryScalar(value: unknown): value is QueryScalar {
  return value === undefined || typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean';
}
