import type { APIRequestContext, APIResponse } from '@playwright/test';
import type { ZodType } from 'zod';
import { API_ROUTES, expectSchema, get, resourcePath, type PaginatedResponse } from '@api/support';
import type { TournamentSummary } from './tournaments.schemas';

// The tournament DTO schemas wait on the published contract: the raw clients serve the
// error-path scenarios, and `getTournaments` checks a placeholder page schema with `expectSchema`.

/** One tournament by its address name. The slug is encoded as a single path segment. */
export function requestTournamentBySlug(request: APIRequestContext, slug: string): Promise<APIResponse> {
  return request.get(resourcePath(API_ROUTES.tournaments, slug));
}

/** The public tournament list. Query values are passed through untouched so a spec can send invalid ones. */
export function requestTournaments(
  request: APIRequestContext,
  params: Readonly<Record<string, string | number>> = {},
): Promise<APIResponse> {
  return request.get(API_ROUTES.tournaments, { params });
}

/** The tournament list as a schema-checked page. Error paths use `requestTournaments`. */
export async function getTournaments(
  request: APIRequestContext,
  schema: ZodType<PaginatedResponse<TournamentSummary>>,
  params: Readonly<{ page?: number; pageSize?: number }> = {},
): Promise<PaginatedResponse<TournamentSummary>> {
  return expectSchema(schema, await get(request, API_ROUTES.tournaments, { params }));
}
