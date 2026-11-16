// spec: specs/features/tournaments.md
// seed: tests/agents/seed.spec.ts
import { test, expect, tournamentsTestConfig } from './fixtures';
import { z } from 'zod';
import { API_ROUTES, apiAuthHeaders, expectSchema } from '@api/support';
import { env } from '@shared/config';
import {
  SEEDED_TOURNAMENT_CLOSED,
  SEEDED_TOURNAMENT_OPEN,
  SEEDED_TOURNAMENT_OPEN_WHITE_BELT_MALE_DIVISIONS,
  seededTournamentsMatching,
} from './seeded';
import { ALL_FEATURES_ENABLED } from '@ui/fixtures/feature-flags.fixture';
import { expectNoWcagViolations } from '@ui/support';
import { squash } from '@squash/annotations';

const featureFlagsSchema = z.object({ Tournaments: z.boolean() });

test.use(tournamentsTestConfig);
test.use({ featureFlagOverrides: { ...ALL_FEATURES_ENABLED, Tournaments: true } });

const seededTournament = SEEDED_TOURNAMENT_CLOSED;
const openTournament = SEEDED_TOURNAMENT_OPEN;
const TOURNAMENT_DAY_AGE = 35;
/** Born on 1 January, so the competitor is `TOURNAMENT_DAY_AGE` on the seeded day: a white-belt adult man, never a fixed date. */
const dateOfBirthAgedOnSeededDay = `${Number(openTournament.day.split('-')[0]) - TOURNAMENT_DAY_AGE}-01-01`;

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

    // Signed-in scenarios use the `competitor` fixture: a fresh account that is deleted afterwards, with every
    // sign-up request aborted (data policy rule 5). The sign-up form is looked at, never submitted.
    test.describe('with a signed-in competitor', () => {
      test.describe('who has a complete profile', () => {
        test.use({ competitorProfile: { gender: 'MALE', belt: 'WHITE', dateOfBirth: dateOfBirthAgedOnSeededDay } });

        test(
          'competitor should find no accessibility violations on the sign-up page',
          {
            tag: ['@acceptance', '@local-sign-in'],
            annotation: squash({
              weight: 'medium',
              status: 'work in progress',
              nature: 'non functional',
              type: 'regression',
            }),
          },
          async ({ page, competitor, tournamentsPage, tournamentPage, competitorSignInPage, signUpPage }) => {
            await test.step('Given tournaments are switched on', () => {
              expect(
                tournamentsSwitchedOn,
                `TOURNAMENTS_FLAG=${env.tournamentsFlag ?? 'unset'} selected the switched-on set but the environment's flag endpoint reports Tournaments: false`,
              ).toBe(true);
            });

            await test.step('And a competitor has signed in with a new email and saved a complete profile', async () => {
              await competitorSignInPage.startSignedIn(competitor.session);
            });

            await test.step('When the competitor opens the sign-up for the "Acceptance Open" tournament from its page', async () => {
              await tournamentsPage.goTo();
              await tournamentsPage.searchFor(openTournament.name);
              // "Acceptance Open" is also the start of "Acceptance Opens Later", so the seed implies several cards.
              await tournamentsPage.expectResultCount(seededTournamentsMatching(openTournament.name).length);
              await tournamentsPage.openTournament(openTournament.name);
              await tournamentPage.chooseSignUp();
              // The offered division means the form has loaded, so the scan sees the form and not the loading state.
              await signUpPage.expectDivisionsOffered(SEEDED_TOURNAMENT_OPEN_WHITE_BELT_MALE_DIVISIONS);
            });

            await test.step('Then the sign-up page has no accessibility violations', async () => {
              await expectNoWcagViolations(page);
            });
          },
        );
      });

      test(
        'competitor should find no accessibility violations on the profile form',
        {
          tag: ['@acceptance', '@local-sign-in'],
          annotation: squash({
            weight: 'medium',
            status: 'work in progress',
            nature: 'non functional',
            type: 'regression',
          }),
        },
        async ({ page, competitor, tournamentsPage, competitorSignInPage, competitorProfilePage }) => {
          await test.step('Given tournaments are switched on', () => {
            expect(
              tournamentsSwitchedOn,
              `TOURNAMENTS_FLAG=${env.tournamentsFlag ?? 'unset'} selected the switched-on set but the environment's flag endpoint reports Tournaments: false`,
            ).toBe(true);
          });

          await test.step('And a competitor has signed in with a new email', async () => {
            await competitorSignInPage.startSignedIn(competitor.session);
          });

          await test.step('When the competitor opens their profile', async () => {
            await tournamentsPage.goTo();
            await competitorProfilePage.openFromAccountLink();
            await competitorProfilePage.expectCreateFormShown();
          });

          await test.step('Then the create-profile form has no accessibility violations', async () => {
            await expectNoWcagViolations(page);
          });
        },
      );
    });
  },
);
