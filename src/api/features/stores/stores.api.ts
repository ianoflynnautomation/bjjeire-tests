import type { APIRequestContext } from '@playwright/test';
import { getTyped, type PaginatedResponse } from '@api/support/api';
import type { GetStorePaginationQuery, StoreDto } from './stores.types';

export type { StoreDto } from './stores.types';

export async function getStores(
  request: APIRequestContext,
  { page = 1, pageSize = 25 }: GetStorePaginationQuery = {},
): Promise<PaginatedResponse<StoreDto>> {
  return getTyped<PaginatedResponse<StoreDto>>(request, '/api/store', { page, pageSize });
}
