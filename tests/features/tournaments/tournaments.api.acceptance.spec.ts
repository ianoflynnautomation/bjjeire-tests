// spec: specs/features/tournaments.md
import { z } from 'zod';
import { test, expect } from '@api/fixtures';
import { API_ROUTES, apiAuthHeaders, expectProblem, expectSchema, ProblemType } from '@api/support';
import { env } from '@shared/config';
import { squash } from '@squash/annotations';

// Every request here is anonymous: a switched-off feature answers before authentication.
test.use({ requestAuth: 'none' });

const featureFlagsSchema = z.object({ Tournaments: z.boolean() });

// The route label is domain wording for titles and steps; the method and path map to the spec's Test design.
const TOURNAMENT_ROUTES = [
  { route: 'the tournament list', method: 'GET', path: API_ROUTES.tournaments },
  { route: "the competitor's own profile", method: 'GET', path: API_ROUTES.competitorMe },
  { route: "the competitor's own registrations", method: 'GET', path: API_ROUTES.registrationMe },
  { route: 'a new registration', method: 'POST', path: API_ROUTES.registrations },
] as const;

test.describe('Tournaments API acceptance', { tag: ['@tournaments', '@tournaments-off', '@api', '@squash'] }, () => {
  let tournamentsSwitchedOn: boolean;

  // Read once for the whole describe, so a rate-limited flag read fails here with its own message.
  test.beforeAll(async ({ playwright }) => {
    // The precondition read uses the project's request options plus the environment's default auth;
    // only the calls under test are anonymous.
    const { baseURL, ignoreHTTPSErrors, extraHTTPHeaders } = test.info().project.use;
    const flags = await playwright.request.newContext({
      ...(baseURL ? { baseURL } : {}),
      ...(ignoreHTTPSErrors === undefined ? {} : { ignoreHTTPSErrors }),
      extraHTTPHeaders: { ...extraHTTPHeaders, ...(await apiAuthHeaders()) },
    });
    try {
      const response = await flags.get(API_ROUTES.featureFlags);
      expect(response.ok(), `${response.url()} status ${response.status()}`).toBe(true);
      tournamentsSwitchedOn = expectSchema(featureFlagsSchema, await response.json()).Tournaments;
    } finally {
      await flags.dispose();
    }
  });

  for (const { route, method, path } of TOURNAMENT_ROUTES) {
    test(
      `client should get not found for ${route} when tournaments are switched off`,
      {
        tag: '@acceptance',
        annotation: squash({ weight: 'medium', status: 'work in progress', nature: 'functional', type: 'regression' }),
      },
      async ({ request }) => {
        await test.step('Given the environment has tournaments switched off', () => {
          // The tag split selects this set by TOURNAMENTS_FLAG; a mismatch with the real flag is a misconfiguration.
          expect(
            tournamentsSwitchedOn,
            `TOURNAMENTS_FLAG=${env.tournamentsFlag ?? 'unset'} selected the switched-off set but the environment's flag endpoint reports Tournaments: true`,
          ).toBe(false);
        });

        const response = await test.step(`When a client with no token requests ${route}`, () =>
          request.fetch(path, { method }));

        const problem = await test.step('Then the response is a not-found problem document', () =>
          expectProblem(response, 404, ProblemType.NotFound));

        await test.step('And the problem says the tournament feature is not available', () => {
          expect(problem.detail).toBe('The tournament feature is not available.');
        });
      },
    );
  }
});
