import type { APIRequestContext } from '@playwright/test';
import { getTyped, type PaginatedResponse } from '@api/support/api';
import type { GetGymsByCountyPaginationQuery, GymDto } from './gyms.types';

export { GymStatus, type GymDto } from './gyms.types';

const endpoint: string = '/api/v1/gym';

export async function getGyms(
  request: APIRequestContext,
  { county, page = 1, pageSize = 25 }: GetGymsByCountyPaginationQuery = {},
): Promise<PaginatedResponse<GymDto>> {
  return getTyped<PaginatedResponse<GymDto>>(request, endpoint, {
    params: { page, pageSize, county },
  });
}
