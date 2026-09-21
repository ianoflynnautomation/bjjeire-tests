import type { APIRequestContext } from '@playwright/test';
import { API_ROUTES, DEFAULT_PAGE, DEFAULT_PAGE_SIZE, get, type PaginatedResponse } from '@api/support';
import { storesPageSchema } from './stores.schemas';
import type { GetStoresPaginationQuery, StoreDto } from './stores.types';

export async function getStores(
  request: APIRequestContext,
  { page = DEFAULT_PAGE, pageSize = DEFAULT_PAGE_SIZE }: GetStoresPaginationQuery = {},
): Promise<PaginatedResponse<StoreDto>> {
  return get(request, API_ROUTES.stores, {
    params: { page, pageSize },
    schema: storesPageSchema,
  });
}
