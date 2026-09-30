import type { APIRequestContext } from '@playwright/test';
import type { ZodType } from 'zod';
import { API_ROUTES, DEFAULT_PAGE, DEFAULT_PAGE_SIZE, expectSchema, get, type PaginatedResponse } from '@api/support';
import type { CompetitionDto, GetCompetitionsPaginationQuery } from './competitions.types';

export async function getCompetitions(
  request: APIRequestContext,
  schema: ZodType<PaginatedResponse<CompetitionDto>>,
  { page = DEFAULT_PAGE, pageSize = DEFAULT_PAGE_SIZE }: GetCompetitionsPaginationQuery = {},
): Promise<PaginatedResponse<CompetitionDto>> {
  const body = await get(request, API_ROUTES.competitions, {
    params: { page, pageSize },
  });
  return expectSchema(schema, body);
}
