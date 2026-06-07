import type { APIRequestContext } from '@playwright/test';
import { API_ROUTES, DEFAULT_PAGE, DEFAULT_PAGE_SIZE, get, type PaginatedResponse } from '@api/support';
import type { GetGymsByCountyPaginationQuery, GymDto } from './gyms.types';

export { GymStatus, type GymDto } from './gyms.types';

export async function getGyms(
  request: APIRequestContext,
  { county, page = DEFAULT_PAGE, pageSize = DEFAULT_PAGE_SIZE }: GetGymsByCountyPaginationQuery = {},
): Promise<PaginatedResponse<GymDto>> {
  return get<PaginatedResponse<GymDto>>(request, API_ROUTES.gyms, {
    params: { page, pageSize, county },
  });
}
