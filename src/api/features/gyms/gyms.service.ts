import type { APIRequestContext } from '@playwright/test';
import type { ZodType } from 'zod';
import { API_ROUTES, DEFAULT_PAGE, DEFAULT_PAGE_SIZE, expectSchema, get, type PaginatedResponse } from '@api/support';
import type { GetGymsByCountyPaginationQuery, GymDto } from './gyms.types';

export async function getGyms(
  request: APIRequestContext,
  schema: ZodType<PaginatedResponse<GymDto>>,
  { county, page = DEFAULT_PAGE, pageSize = DEFAULT_PAGE_SIZE }: GetGymsByCountyPaginationQuery = {},
): Promise<PaginatedResponse<GymDto>> {
  const body = await get(request, API_ROUTES.gyms, {
    params: { page, pageSize, county },
  });
  return expectSchema(schema, body);
}
