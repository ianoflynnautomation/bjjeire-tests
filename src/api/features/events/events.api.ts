import type { APIRequestContext } from '@playwright/test';
import { getTyped, type PaginatedResponse } from '@api/support/api';
import type { BjjEventDto, GetBjjEventsPaginationQuery } from './events.types';

export { BjjEventType, EventStatus, PricingType, type BjjEventDto } from './events.types';

export async function getBjjEvents(
  request: APIRequestContext,
  { county, type, page = 1, pageSize = 25 }: GetBjjEventsPaginationQuery = {},
): Promise<PaginatedResponse<BjjEventDto>> {
  const params: Record<string, string | number | boolean | undefined> = { page, pageSize };
  params.county = county;
  params.type = type;
  return getTyped<PaginatedResponse<BjjEventDto>>(request, '/api/bjjevent', params);
}
