import type { APIRequestContext } from '@playwright/test';
import { API_ROUTES, DEFAULT_PAGE, DEFAULT_PAGE_SIZE, get, type PaginatedResponse } from '@api/support';
import { competitionsPageSchema } from './competitions.schemas';
import type { CompetitionDto, GetCompetitionsPaginationQuery } from './competitions.types';

export type { CompetitionDto } from './competitions.types';

export async function getCompetitions(
  request: APIRequestContext,
  { page = DEFAULT_PAGE, pageSize = DEFAULT_PAGE_SIZE }: GetCompetitionsPaginationQuery = {},
): Promise<PaginatedResponse<CompetitionDto>> {
  return get(request, API_ROUTES.competitions, {
    params: { page, pageSize },
    schema: competitionsPageSchema,
  });
}
