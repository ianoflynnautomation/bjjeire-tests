import type { APIRequestContext } from '@playwright/test';
import { API_ROUTES, DEFAULT_PAGE, DEFAULT_PAGE_SIZE, getTyped, type PaginatedResponse } from '@api/support/api';
import type { CompetitionDto, GetCompetitionsPaginationQuery } from './competitions.types';

export type { CompetitionDto } from './competitions.types';

export async function getCompetitions(
  request: APIRequestContext,
  { page = DEFAULT_PAGE, pageSize = DEFAULT_PAGE_SIZE }: GetCompetitionsPaginationQuery = {},
): Promise<PaginatedResponse<CompetitionDto>> {
  return getTyped<PaginatedResponse<CompetitionDto>>(request, API_ROUTES.competitions, {
    params: { page, pageSize },
  });
}
