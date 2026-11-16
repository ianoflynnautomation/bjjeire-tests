import type { APIRequestContext, APIResponse } from '@playwright/test';
import type { z, ZodType } from 'zod';
import { API_ROUTES, expectSchema, get, resourcePath, type PaginatedResponse } from '@api/support';
import {
  competitorListSchema,
  tournamentDivisionsSchema,
  type CompetitorListDivision,
  type TournamentSummary,
} from './tournaments.schemas';

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

/** A tournament's id and division ids in the tournament's order, read by address name. */
export async function getTournamentDivisions(
  request: APIRequestContext,
  slug: string,
): Promise<z.infer<typeof tournamentDivisionsSchema>> {
  return expectSchema(tournamentDivisionsSchema, await get(request, resourcePath(API_ROUTES.tournaments, slug)));
}

/** The public competitor list of a tournament, by object id (the address name answers 400), schema-checked. */
export async function getTournamentCompetitors(
  request: APIRequestContext,
  tournamentId: string,
): Promise<readonly CompetitorListDivision[]> {
  return expectSchema(
    competitorListSchema,
    await get(request, `${resourcePath(API_ROUTES.tournaments, tournamentId)}/competitor`),
  );
}

/** The public competitor list for any address value, unchecked, so a spec can send a malformed or unknown one. */
export function requestTournamentCompetitors(request: APIRequestContext, address: string): Promise<APIResponse> {
  return request.get(`${resourcePath(API_ROUTES.tournaments, address)}/competitor`);
}

/** The Stripe webhook path with a method of the caller's choice. Never send POST: that is the real webhook. */
export function requestStripeWebhook(
  request: APIRequestContext,
  method: 'GET' | 'PUT' | 'DELETE',
): Promise<APIResponse> {
  return request.fetch(`${API_ROUTES.registrations}/stripe-webhook`, { method });
}

/** The divisions a competitor may enter in a tournament, by object id. Unchecked: the not-open refusal is the behaviour under test. */
export function requestEligibleDivisions(
  request: APIRequestContext,
  tournamentId: string,
  competitor: Readonly<{ authHeaders: Readonly<Record<string, string>> }>,
): Promise<APIResponse> {
  return request.get(`${resourcePath(API_ROUTES.tournaments, tournamentId)}/eligible-division`, {
    headers: competitor.authHeaders,
  });
}

/**
 * A sign-up for a division with both consents. Only for a request the API must refuse before it takes a place (a tournament
 * outside its registration window, or one that exists nowhere): a 201 here takes a place that cannot be given back.
 */
export function requestSignUp(
  request: APIRequestContext,
  body: Readonly<{ tournamentId: string; divisionId: string }>,
  competitor: Readonly<{ authHeaders: Readonly<Record<string, string>> }>,
): Promise<APIResponse> {
  return request.post(API_ROUTES.registrations, {
    headers: competitor.authHeaders,
    data: { ...body, acceptPublicListing: true, acceptTerms: true },
  });
}

/**
 * A sign-up with a body the caller shapes, to prove a refusal on its consents. Send only a tournament id that exists
 * nowhere: the API validates the body before it looks the tournament up, so no place can be taken.
 */
export function requestSignUpBody(
  request: APIRequestContext,
  data: Readonly<Record<string, unknown>>,
  competitor: Readonly<{ authHeaders: Readonly<Record<string, string>> }>,
): Promise<APIResponse> {
  return request.post(API_ROUTES.registrations, { headers: competitor.authHeaders, data });
}

/**
 * A sign-up whose body is not JSON, sent with the content type the caller names. Send only a tournament id that
 * exists nowhere, so nothing can be created even if the refusal regressed.
 */
export function requestSignUpRaw(
  request: APIRequestContext,
  body: string,
  contentType: string,
  competitor: Readonly<{ authHeaders: Readonly<Record<string, string>> }>,
): Promise<APIResponse> {
  return request.post(API_ROUTES.registrations, {
    headers: { ...competitor.authHeaders, 'content-type': contentType },
    data: body,
  });
}

/**
 * Asks to return to the payment page of a sign-up by id. Send only an id that exists nowhere or is malformed: a real
 * sign-up's id would resume somebody's payment.
 */
export function requestCheckoutResume(
  request: APIRequestContext,
  registrationId: string,
  competitor: Readonly<{ authHeaders: Readonly<Record<string, string>> }>,
): Promise<APIResponse> {
  return request.post(`${resourcePath(API_ROUTES.registrations, registrationId)}/checkout`, {
    headers: competitor.authHeaders,
  });
}

/**
 * A refusal-path request made with the competitor's token. The only body it can carry is empty (`{}`), and the caller
 * names an id that exists nowhere or is malformed, so nothing is created, changed or removed even if the refusal
 * regressed. A request that needs a real body goes through `requestAsCompetitorWithBody`.
 */
export function requestAsCompetitor(
  request: APIRequestContext,
  competitor: Readonly<{ authHeaders: Readonly<Record<string, string>> }>,
  call: Readonly<{ method: 'GET' | 'POST' | 'PUT' | 'DELETE'; path: string; data?: Readonly<Record<string, never>> }>,
): Promise<APIResponse> {
  return request.fetch(call.path, {
    method: call.method,
    headers: competitor.authHeaders,
    ...(call.data === undefined ? {} : { data: call.data }),
  });
}

/**
 * A request with a body of the caller's choosing, for a competitor's own profile or for a move aimed at a sign-up id
 * that exists nowhere. Never aim it at a real sign-up or tournament.
 */
export function requestAsCompetitorWithBody(
  request: APIRequestContext,
  competitor: Readonly<{ authHeaders: Readonly<Record<string, string>> }>,
  call: Readonly<{ method: 'POST' | 'PUT'; path: string; data: unknown }>,
): Promise<APIResponse> {
  return request.fetch(call.path, { method: call.method, headers: competitor.authHeaders, data: call.data });
}
