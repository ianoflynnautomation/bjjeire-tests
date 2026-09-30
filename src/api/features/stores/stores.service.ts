import type { APIRequestContext } from '@playwright/test';
import type { ZodType } from 'zod';
import { API_ROUTES, DEFAULT_PAGE, DEFAULT_PAGE_SIZE, expectSchema, get, type PaginatedResponse } from '@api/support';
import type { GetStoresPaginationQuery, StoreDto } from './stores.types';

export async function getStores(
  request: APIRequestContext,
  schema: ZodType<PaginatedResponse<StoreDto>>,
  { page = DEFAULT_PAGE, pageSize = DEFAULT_PAGE_SIZE }: GetStoresPaginationQuery = {},
): Promise<PaginatedResponse<StoreDto>> {
  const body = await get(request, API_ROUTES.stores, {
    params: { page, pageSize },
  });
  return expectSchema(schema, body);
}
