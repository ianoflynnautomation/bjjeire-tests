import type { APIRequestContext, APIResponse } from '@playwright/test';
import type { ZodType } from 'zod';
import { API_ROUTES, expectSchema, get, resourcePath } from '@api/support';
import type {
  BjjEireCompetition,
  BjjEireCompetitionsPage,
  BjjEireDivisionCompetitors,
  BjjEireLeaderboard,
} from './bjjeire-competitions.schemas';

/** `GET /api/v1/bjjeire-competition`: the upcoming published competitions, earliest day then name. */
export async function getBjjEireCompetitions(
  request: APIRequestContext,
  schema: ZodType<BjjEireCompetitionsPage>,
  { page, pageSize }: Readonly<{ page?: number; pageSize?: number }> = {},
): Promise<BjjEireCompetitionsPage> {
  const body = await get(request, API_ROUTES.bjjEireCompetitions, {
    params: { ...(page === undefined ? {} : { page }), ...(pageSize === undefined ? {} : { pageSize }) },
  });
  return expectSchema(schema, body);
}

/** `GET /api/v1/bjjeire-competition/{slug}`: one published competition with its divisions, by address name. */
export async function getBjjEireCompetitionBySlug(
  request: APIRequestContext,
  schema: ZodType<BjjEireCompetition>,
  slug: string,
): Promise<BjjEireCompetition> {
  const body = await get(request, resourcePath(API_ROUTES.bjjEireCompetitions, slug));
  return expectSchema(schema, body);
}

/** `GET /api/v1/bjjeire-competition/{id}/competitor`: each division's confirmed competitors, by competition id. */
export async function getBjjEireCompetitors(
  request: APIRequestContext,
  schema: ZodType<BjjEireDivisionCompetitors>,
  competitionId: string,
): Promise<BjjEireDivisionCompetitors> {
  const body = await get(request, `${resourcePath(API_ROUTES.bjjEireCompetitions, competitionId)}/competitor`);
  return expectSchema(schema, body);
}

/** `GET /api/v1/bjjeire-competition/{id}/leaderboard`: podiums, academy and affiliation rankings, winners once finished. */
export async function getBjjEireLeaderboard(
  request: APIRequestContext,
  schema: ZodType<BjjEireLeaderboard>,
  competitionId: string,
): Promise<BjjEireLeaderboard> {
  const body = await get(request, `${resourcePath(API_ROUTES.bjjEireCompetitions, competitionId)}/leaderboard`);
  return expectSchema(schema, body);
}

// Raw clients for the refusal paths of the BJJ Éire competition, competitor and registration routes. They return the
// unchecked response so a spec can assert a status and problem type. None may take a place on a seeded competition:
// each doc comment names the only ids it may carry.

type CompetitorAuth = Readonly<{ authHeaders: Readonly<Record<string, string>> }>;

/** The public competitor list for any address value, unchecked, so a spec can send a malformed or unknown one. */
export function requestBjjEireCompetitors(request: APIRequestContext, address: string): Promise<APIResponse> {
  return request.get(`${resourcePath(API_ROUTES.bjjEireCompetitions, address)}/competitor`);
}

/** The Stripe webhook path with a method of the caller's choice. Never send POST: that is the real webhook. */
export function requestStripeWebhook(
  request: APIRequestContext,
  method: 'GET' | 'PUT' | 'DELETE',
): Promise<APIResponse> {
  return request.fetch(`${API_ROUTES.registrations}/stripe-webhook`, { method });
}

/** The divisions a competitor may enter in a competition, by object id. Unchecked: the not-open refusal is the behaviour under test. */
export function requestEligibleDivisions(
  request: APIRequestContext,
  competitionId: string,
  competitor: CompetitorAuth,
): Promise<APIResponse> {
  return request.get(`${resourcePath(API_ROUTES.bjjEireCompetitions, competitionId)}/eligible-division`, {
    headers: competitor.authHeaders,
  });
}

/**
 * A sign-up for a division with both consents. Only for a request the API must refuse before it takes a place (a
 * competition outside its registration window, or one that exists nowhere): a 201 here takes a place that cannot be
 * given back.
 */
export function requestSignUp(
  request: APIRequestContext,
  body: Readonly<{ competitionId: string; divisionId: string }>,
  competitor: CompetitorAuth,
): Promise<APIResponse> {
  return request.post(API_ROUTES.registrations, {
    headers: competitor.authHeaders,
    data: { ...body, acceptPublicListing: true, acceptTerms: true },
  });
}

/**
 * A sign-up with a body the caller shapes, to prove a refusal on its consents. Send only a competition id that exists
 * nowhere: the API validates the body before it looks the competition up, so no place can be taken.
 */
export function requestSignUpBody(
  request: APIRequestContext,
  data: Readonly<Record<string, unknown>>,
  competitor: CompetitorAuth,
): Promise<APIResponse> {
  return request.post(API_ROUTES.registrations, { headers: competitor.authHeaders, data });
}

/**
 * A sign-up whose body is not JSON, sent with the content type the caller names. Send only a competition id that
 * exists nowhere, so nothing can be created even if the refusal regressed.
 */
export function requestSignUpRaw(
  request: APIRequestContext,
  body: string,
  contentType: string,
  competitor: CompetitorAuth,
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
  competitor: CompetitorAuth,
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
  competitor: CompetitorAuth,
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
 * that exists nowhere. Never aim it at a real sign-up or competition.
 */
export function requestAsCompetitorWithBody(
  request: APIRequestContext,
  competitor: CompetitorAuth,
  call: Readonly<{ method: 'POST' | 'PUT'; path: string; data: unknown }>,
): Promise<APIResponse> {
  return request.fetch(call.path, { method: call.method, headers: competitor.authHeaders, data: call.data });
}
