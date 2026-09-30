import type { APIRequestContext } from '@playwright/test';
import type { ZodType } from 'zod';
import { API_ROUTES, DEFAULT_PAGE, DEFAULT_PAGE_SIZE, expectSchema, get, type PaginatedResponse } from '@api/support';
import type { BjjEventDto, GetBjjEventsPaginationQuery } from './events.types';

export async function getBjjEvents(
  request: APIRequestContext,
  schema: ZodType<PaginatedResponse<BjjEventDto>>,
  { county, types, page = DEFAULT_PAGE, pageSize = DEFAULT_PAGE_SIZE }: GetBjjEventsPaginationQuery = {},
): Promise<PaginatedResponse<BjjEventDto>> {
  const body = await get(request, API_ROUTES.bjjEvents, {
    params: { page, pageSize, county, types },
  });
  return expectSchema(schema, body);
}
