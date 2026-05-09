import type { APIRequestContext } from '@playwright/test';
import { API_ROUTES, getTyped, type PaginatedResponse } from '@api/support/api';
import type { GetGymsByCountyPaginationQuery, GymDto } from './gyms.types';

export { GymStatus, type GymDto } from './gyms.types';

export async function getGyms(
  request: APIRequestContext,
  { county, page = 1, pageSize = 25 }: GetGymsByCountyPaginationQuery = {},
): Promise<PaginatedResponse<GymDto>> {
  return getTyped<PaginatedResponse<GymDto>>(request, API_ROUTES.gyms, {
    params: { page, pageSize, county },
  });
}
