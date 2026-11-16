import { faker } from '@faker-js/faker';
import { expect, type APIRequestContext, type APIResponse, type PlaywrightWorkerArgs } from '@playwright/test';
import { z } from 'zod';
import { API_ROUTES, expectSchema } from '@api/support';
import { env } from '@shared/config';

// Competitor sign-in for the local stack (`bjjeire.local-sign-in.enabled`, `@local-sign-in` specs). The route
// issues a competitor token for any email, and the same email is always the same competitor. It is hidden from the
// published OpenAPI document, so these shapes are hand-written from the app's `LocalSignInController`.
const LOCAL_COMPETITOR_SIGN_IN = `${API_ROUTES.localSignIn}/competitor`;

const issuedTokenSchema = z.object({ accessToken: z.string().min(1), expiresAt: z.string().min(1) });

type PlaywrightApi = PlaywrightWorkerArgs['playwright'];

export type CompetitorProfileOptions = Readonly<{
  gender: 'MALE' | 'FEMALE';
  belt: 'WHITE' | 'BLUE' | 'PURPLE' | 'BROWN' | 'BLACK';
  /** ISO date, `YYYY-MM-DD`. */
  dateOfBirth: string;
  /** A typed academy name; null or absent means none. Never a seeded gym name. */
  academy?: string;
  affiliation?: string;
}>;

/** A competitor the test owns. `email` and `displayName` are built from a faker token, never a seeded name. */
export type LocalCompetitor = Readonly<{
  email: string;
  displayName: string;
  token: string;
  /** The SPA's local session, to seed `sessionStorage[LOCAL_COMPETITOR_SESSION_KEY]` for a UI test that starts signed in. */
  session: Readonly<{ accessToken: string; expiresAt: string }>;
  authHeaders: Readonly<Record<string, string>>;
}>;

const TOKEN_LENGTH = 12;

/** A fresh identity: `PW <token>` as the display name and `pw-<token>@example.test` as the email. */
export function newCompetitorIdentity(): Readonly<{ email: string; displayName: string; firstName: string }> {
  const token = faker.string.alphanumeric({ length: TOKEN_LENGTH, casing: 'lower' });
  return { email: `pw-${token}@example.test`, displayName: `PW ${token}`, firstName: `PW ${token}` };
}

/** An API context on the API origin, not the UI's, so a UI test reaches the same routes. */
export function newCompetitorApiContext(playwright: PlaywrightApi): Promise<APIRequestContext> {
  return playwright.request.newContext({
    baseURL: env.apiUrl,
    ignoreHTTPSErrors: env.acceptInvalidCerts,
    extraHTTPHeaders: { 'content-type': 'application/json' },
  });
}

export async function signInLocalCompetitor(
  request: APIRequestContext,
  email: string,
): Promise<z.infer<typeof issuedTokenSchema>> {
  const response = await request.post(LOCAL_COMPETITOR_SIGN_IN, { data: { email } });
  if (!response.ok()) {
    throw new Error(
      `POST ${LOCAL_COMPETITOR_SIGN_IN} → ${response.status()}: the stack has no local competitor sign-in. Set LOCAL_SIGN_IN=off to skip @local-sign-in specs.\n${await response.text()}`,
    );
  }
  return expectSchema(issuedTokenSchema, await response.json());
}

/** The body of a complete profile save. Spec rows change one field of it to prove a refusal. */
export function profileBody(firstName: string, profile: CompetitorProfileOptions): Record<string, unknown> {
  return {
    firstName,
    lastName: 'Tester',
    nationality: 'IE',
    dateOfBirth: profile.dateOfBirth,
    gender: profile.gender,
    belt: profile.belt,
    academy: profile.academy ? { name: profile.academy } : null,
    ...(profile.affiliation ? { affiliation: profile.affiliation } : {}),
  };
}

/** Saves a complete profile for the signed-in competitor. The name is the display name; no phone, address or nationality is needed. */
export async function saveCompetitorProfile(
  request: APIRequestContext,
  competitor: Pick<LocalCompetitor, 'authHeaders' | 'displayName'>,
  profile: CompetitorProfileOptions,
  firstName: string = competitor.displayName,
): Promise<void> {
  const response = await request.put(API_ROUTES.competitorMe, {
    headers: competitor.authHeaders,
    data: profileBody(firstName, profile),
  });
  if (!response.ok())
    throw new Error(`PUT ${API_ROUTES.competitorMe} → ${response.status()}\n${await response.text()}`);
}

// Placeholder until the contract publishes the competitor DTO (the route needs a competitor token, so the published
// document may never carry it): the fields these specs read. Before a first save only `email`, `profileComplete` and
// `saved` are set.
const ownCompetitorSchema = z.object({
  email: z.string(),
  profileComplete: z.boolean(),
  saved: z.boolean(),
  firstName: z.string().nullish(),
  lastName: z.string().nullish(),
  gender: z.string().nullish(),
  belt: z.string().nullish(),
  dateOfBirth: z.string().nullish(),
});
export type OwnCompetitor = z.infer<typeof ownCompetitorSchema>;

/** The competitor's own profile, schema-checked. Status 200 is asserted by the check. */
export async function getOwnCompetitor(request: APIRequestContext, token: string): Promise<OwnCompetitor> {
  const response = await requestOwnCompetitor(request, token);
  if (!response.ok())
    throw new Error(`GET ${API_ROUTES.competitorMe} → ${response.status()}\n${await response.text()}`);
  return expectSchema(ownCompetitorSchema, await response.json());
}

/** The competitor's own profile, for the caller to assert on. */
export function requestOwnCompetitor(request: APIRequestContext, token: string): Promise<APIResponse> {
  return request.get(API_ROUTES.competitorMe, { headers: { authorization: `Bearer ${token}` } });
}

/** Deletes the competitor and their profile. A 404 is fine: the test may have deleted it. A refusal (a sign-up exists) is not ignored. */
export async function deleteLocalCompetitor(request: APIRequestContext, token: string): Promise<void> {
  const response = await request.delete(API_ROUTES.competitorMe, { headers: { authorization: `Bearer ${token}` } });
  if (!response.ok() && response.status() !== 404) {
    throw new Error(`DELETE ${API_ROUTES.competitorMe} → ${response.status()}\n${await response.text()}`);
  }
}

const FIRST_RETRY_MS = 250;
const SECOND_RETRY_MS = 500;
const LATER_RETRY_MS = 1000;
const RETRY_SIGN_IN_INTERVALS_MS = [FIRST_RETRY_MS, SECOND_RETRY_MS, LATER_RETRY_MS];
const RETRY_SIGN_IN_TIMEOUT_MS = 10_000;
const HTTP_OK_MIN = 200;
const HTTP_OK_MAX = 300;
const HTTP_UNAUTHORIZED = 401;
const HTTP_NOT_FOUND = 404;

/**
 * Removes the competitor at the end of a test. A 401 on the first delete is ambiguous (the competitor was already
 * deleted, so its token is revoked, or the token is simply bad), so it is not trusted: sign in again with the email
 * and delete with the fresh token. The app refuses a token issued in the same second as a deletion (`iat` has whole
 * seconds), so the fresh sign-in is retried until a token is accepted. A 2xx or 404 ends it; anything else fails
 * loudly, naming the email.
 */
export async function removeLocalCompetitor(
  request: APIRequestContext,
  competitor: Readonly<{ email: string; token: string }>,
): Promise<void> {
  const first = await request.delete(API_ROUTES.competitorMe, {
    headers: { authorization: `Bearer ${competitor.token}` },
  });
  if (first.ok() || first.status() === 404) return;
  if (first.status() !== 401) {
    throw new Error(
      `Teardown of ${competitor.email}: DELETE ${API_ROUTES.competitorMe} → ${first.status()}\n${await first.text()}`,
    );
  }
  // Only a 401 (a token from the same second as the deletion) is retried; any other answer ends the poll at once.
  let last: { status: number; body: string } | undefined;
  await expect
    .poll(
      async () => {
        const fresh = await signInLocalCompetitor(request, competitor.email);
        const response = await request.delete(API_ROUTES.competitorMe, {
          headers: { authorization: `Bearer ${fresh.accessToken}` },
        });
        last = { status: response.status(), body: await response.text() };
        return last.status;
      },
      {
        message: `Teardown of ${competitor.email}: still 401 after a fresh sign-in, so the competitor may be left behind`,
        intervals: RETRY_SIGN_IN_INTERVALS_MS,
        timeout: RETRY_SIGN_IN_TIMEOUT_MS,
      },
    )
    .not.toBe(HTTP_UNAUTHORIZED);
  const settled = last;
  if (
    settled &&
    !(settled.status >= HTTP_OK_MIN && settled.status < HTTP_OK_MAX) &&
    settled.status !== HTTP_NOT_FOUND
  ) {
    throw new Error(
      `Teardown of ${competitor.email}: DELETE ${API_ROUTES.competitorMe} with a fresh token → ${settled.status}\n${settled.body}`,
    );
  }
}

/**
 * Signs in a fresh competitor, saves a profile when `profile` is given, runs `use`, then deletes the competitor
 * (also when the test failed). Creates no sign-up, so deleting is always allowed.
 */
export async function withLocalCompetitor(
  playwright: PlaywrightApi,
  profile: CompetitorProfileOptions | undefined,
  use: (competitor: LocalCompetitor) => Promise<void>,
): Promise<void> {
  const context = await newCompetitorApiContext(playwright);
  try {
    const identity = newCompetitorIdentity();
    const session = await signInLocalCompetitor(context, identity.email);
    const competitor: LocalCompetitor = {
      email: identity.email,
      displayName: identity.displayName,
      token: session.accessToken,
      session,
      authHeaders: { authorization: `Bearer ${session.accessToken}` },
    };
    try {
      if (profile) await saveCompetitorProfile(context, competitor, profile);
      await use(competitor);
    } finally {
      await removeLocalCompetitor(context, competitor);
    }
  } finally {
    await context.dispose();
  }
}
