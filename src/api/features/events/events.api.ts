import type { APIRequestContext } from '@playwright/test';
import { API_ROUTES, getTyped, type PaginatedResponse } from '@api/support/api';
import type { BjjEventDto, GetBjjEventsPaginationQuery } from './events.types';

export { BjjEventType, EventStatus, PricingType, type BjjEventDto } from './events.types';

export async function getBjjEvents(
  request: APIRequestContext,
  { county, type, page = 1, pageSize = 25 }: GetBjjEventsPaginationQuery = {},
): Promise<PaginatedResponse<BjjEventDto>> {
  return getTyped<PaginatedResponse<BjjEventDto>>(request, API_ROUTES.bjjEvents, {
    params: { page, pageSize, county, type },
  });
}
