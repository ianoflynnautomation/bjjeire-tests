import type { APIRequestContext } from '@playwright/test';
import { getTyped, type PaginatedResponse } from '@api/support/api';
import type { GetGymsByCountyPaginationQuery, GymDto } from './gyms.types';

export { GymStatus, type GymDto } from './gyms.types';

export async function getGyms(
  request: APIRequestContext,
  { county, page = 1, pageSize = 25 }: GetGymsByCountyPaginationQuery = {},
): Promise<PaginatedResponse<GymDto>> {
  const params: Record<string, string | number | boolean | undefined> = { page, pageSize };
  params.county = county;
  return getTyped<PaginatedResponse<GymDto>>(request, '/api/gym', params);
}
