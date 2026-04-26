import type { APIRequestContext } from '@playwright/test';
import { getTyped, type PaginatedResponse } from '@api/support/api';
import type { BjjEventDto, GetBjjEventsPaginationQuery } from './events.types';

export { BjjEventType, EventStatus, PricingType, type BjjEventDto } from './events.types';

const endpoint: string = '/api/v1/bjjevent';

export async function getBjjEvents(
  request: APIRequestContext,
  { county, type, page = 1, pageSize = 25 }: GetBjjEventsPaginationQuery = {},
): Promise<PaginatedResponse<BjjEventDto>> {
  return getTyped<PaginatedResponse<BjjEventDto>>(request, endpoint, {
    params: { page, pageSize, county, type },
  });
}
