// spec: specs/features/tournaments.md
// seed: tests/agents/seed.spec.ts
import { test, expect, tournamentsTestConfig } from './fixtures';
import { z } from 'zod';
import { API_ROUTES, apiAuthHeaders, expectSchema } from '@api/support';
import { env } from '@shared/config';
import { SEEDED_TOURNAMENT_CLOSED, seededTournamentsMatching } from './seeded';
import { ALL_FEATURES_ENABLED } from '@ui/fixtures/feature-flags.fixture';
import { expectNoWcagViolations } from '@ui/support';
import { squash } from '@squash/annotations';

const featureFlagsSchema = z.object({ Tournaments: z.boolean() });

test.use(tournamentsTestConfig);
test.use({ featureFlagOverrides: { ...ALL_FEATURES_ENABLED, Tournaments: true } });

const seededTournament = SEEDED_TOURNAMENT_CLOSED;

test.describe(
  'Tournaments accessibility acceptance',
  { tag: ['@tournaments', '@tournaments-on', '@a11y', '@desktop', '@squash'] },
  () => {
    let tournamentsSwitchedOn: boolean;

    // Stubbing the browser flag is not enough: the API must serve tournaments.
    test.beforeAll(async ({ playwright }) => {
      const { ignoreHTTPSErrors } = test.info().project.use;
      const flags = await playwright.request.newContext({
        ...(ignoreHTTPSErrors === undefined ? {} : { ignoreHTTPSErrors }),
        extraHTTPHeaders: { ...test.info().project.use.extraHTTPHeaders, ...(await apiAuthHeaders()) },
      });
      try {
        const response = await flags.get(`${env.apiUrl}${API_ROUTES.featureFlags}`);
        expect(response.ok(), `${response.url()} status ${response.status()}`).toBe(true);
        tournamentsSwitchedOn = expectSchema(featureFlagsSchema, await response.json()).Tournaments;
      } finally {
        await flags.dispose();
      }
    });

    test(
      'visitor should find no accessibility violations on the tournament list',
      {
        tag: '@acceptance',
        annotation: squash({
          weight: 'medium',
          status: 'work in progress',
          nature: 'non functional',
          type: 'regression',
        }),
      },
      async ({ page, tournamentsPage }) => {
        await test.step('Given tournaments are switched on', () => {
          expect(
            tournamentsSwitchedOn,
            `TOURNAMENTS_FLAG=${env.tournamentsFlag ?? 'unset'} selected the switched-on set but the environment's flag endpoint reports Tournaments: false`,
          ).toBe(true);
        });

        await test.step('When a visitor opens Tournaments', async () => {
          await tournamentsPage.goTo();
          await tournamentsPage.verifyIsLoaded();
          await tournamentsPage.expectListNotEmpty();
        });

        await test.step('Then the tournament list has no accessibility violations', async () => {
          await expectNoWcagViolations(page);
        });
      },
    );

    test(
      "visitor should find no accessibility violations on a tournament's details",
      {
        tag: '@acceptance',
        annotation: squash({
          weight: 'medium',
          status: 'work in progress',
          nature: 'non functional',
          type: 'regression',
        }),
      },
      async ({ page, tournamentsPage, tournamentPage }) => {
        await test.step('Given tournaments are switched on', () => {
          expect(
            tournamentsSwitchedOn,
            `TOURNAMENTS_FLAG=${env.tournamentsFlag ?? 'unset'} selected the switched-on set but the environment's flag endpoint reports Tournaments: false`,
          ).toBe(true);
        });

        await test.step('When a visitor opens Tournaments', async () => {
          await tournamentsPage.goTo();
        });

        await test.step('And the visitor searches for "Acceptance Closed"', async () => {
          await tournamentsPage.searchFor(seededTournament.name);
          await tournamentsPage.expectResultCount(seededTournamentsMatching(seededTournament.name).length);
        });

        await test.step('And the visitor opens the "Acceptance Closed" tournament', async () => {
          await tournamentsPage.openTournament(seededTournament.name);
          await tournamentPage.expectName(seededTournament.name);
        });

        await test.step('Then the tournament details have no accessibility violations', async () => {
          await expectNoWcagViolations(page);
        });
      },
    );
  },
);
