import type { APIRequestContext } from '@playwright/test';
import type { ZodType } from 'zod';
import { getParsed, getTyped } from '../client/http';
import type { PaginatedResponse } from '../contracts/common-contracts';
import { pagedResponseSchema } from '../schemas';
import { DEFAULT_PAGE, DEFAULT_PAGE_SIZE, type PaginationQuery } from './pagination';

type QueryScalar = string | number | boolean | undefined;

export type PaginatedGetEndpoint<TQuery extends PaginationQuery, TDto> = (
  request: APIRequestContext,
  query?: TQuery,
) => Promise<PaginatedResponse<TDto>>;

export type PaginatedGetEndpointConfig<TQuery extends PaginationQuery> = Readonly<{
  route: string;
  defaults?: Readonly<Partial<TQuery>>;
  itemSchema?: ZodType;
}>;

export function createPaginatedGetEndpoint<TQuery extends PaginationQuery, TDto>(
  config: PaginatedGetEndpointConfig<TQuery>,
): PaginatedGetEndpoint<TQuery, TDto> {
  return async (request, query) => {
    const merged = { ...config.defaults, ...query } as TQuery;
    const params: Record<string, QueryScalar> = {
      page: merged.page ?? DEFAULT_PAGE,
      pageSize: merged.pageSize ?? DEFAULT_PAGE_SIZE,
    };

    for (const [key, value] of Object.entries(merged)) {
      if (key === 'page' || key === 'pageSize') continue;
      if (isSupportedQueryParamValue(value)) {
        params[key] = value;
      }
    }

    if (config.itemSchema) {
      const parsed = await getParsed(request, config.route, pagedResponseSchema(config.itemSchema), {
        params,
      });
      return parsed as PaginatedResponse<TDto>;
    }

    return getTyped<PaginatedResponse<TDto>>(request, config.route, { params });
  };
}

function isSupportedQueryParamValue(value: unknown): value is QueryScalar {
  return value === undefined || typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean';
}
