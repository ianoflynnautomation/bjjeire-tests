import type { APIRequestContext } from '@playwright/test';
import { getTyped, type PaginatedResponse } from '@api/support/api';
import type { CompetitionDto, GetCompetitionsPaginationQuery } from './competitions.types';

export type { CompetitionDto } from './competitions.types';

export async function getCompetitions(
  request: APIRequestContext,
  { page = 1, pageSize = 25 }: GetCompetitionsPaginationQuery = {},
): Promise<PaginatedResponse<CompetitionDto>> {
  return getTyped<PaginatedResponse<CompetitionDto>>(request, '/api/competition', { page, pageSize });
}
