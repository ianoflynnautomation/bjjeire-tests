// spec: specs/features/tournaments.md
// seed: tests/agents/seed.spec.ts
import { test, expect, tournamentsTestConfig } from './fixtures';
import { z } from 'zod';
import { API_ROUTES, apiAuthHeaders, expectSchema, resourcePath } from '@api/support';
import { env } from '@shared/config';
import {
  SEEDED_TOURNAMENT_CLOSED,
  SEEDED_TOURNAMENT_OPEN,
  SEEDED_TOURNAMENT_OPEN_DIVISION_GROUPS,
  SEEDED_TOURNAMENT_OPENS_LATER,
  seededTournamentsMatching,
} from './seeded';
import { dublinDateTime, longDay } from './dublin-time';
import { registrationWindowFrom } from './seed-facts';
import { tournamentCardFromSeeded } from '@ui/pages/tournaments/tournaments.card.mapper';
import { ALL_FEATURES_ENABLED } from '@ui/fixtures/feature-flags.fixture';
import { squash } from '@squash/annotations';

const featureFlagsSchema = z.object({ Tournaments: z.boolean() });

test.use(tournamentsTestConfig);
test.use({ featureFlagOverrides: { ...ALL_FEATURES_ENABLED, Tournaments: true } });

const seededTournament = SEEDED_TOURNAMENT_CLOSED;
const openTournament = SEEDED_TOURNAMENT_OPEN;
const openTournamentCard = tournamentCardFromSeeded(openTournament);

test.describe(
  'Tournament details UI acceptance',
  { tag: ['@tournaments', '@tournaments-on', '@ui', '@desktop', '@squash'] },
  () => {
    let tournamentsSwitchedOn: boolean;

    // Read once per worker from the environment's own flag endpoint (the UI project's base URL is the site,
    // so the API URL is absolute). Stubbing the browser flag is not enough: the API must serve tournaments.
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

    // The tag split selects this set by TOURNAMENTS_FLAG; a mismatch with the real flag is a misconfiguration.
    const givenTournamentsSwitchedOn = (): void => {
      expect(
        tournamentsSwitchedOn,
        `TOURNAMENTS_FLAG=${env.tournamentsFlag ?? 'unset'} selected the switched-on set but the environment's flag endpoint reports Tournaments: false`,
      ).toBe(true);
    };

    test(
      "visitor should see a tournament's details, fee, registration window and divisions",
      {
        tag: '@acceptance',
        annotation: squash({ weight: 'high', status: 'work in progress', nature: 'functional', type: 'regression' }),
      },
      async ({ request, tournamentsPage, tournamentPage }) => {
        const window = await test.step('Given tournaments are switched on', async () => {
          givenTournamentsSwitchedOn();
          const response = await request.get(
            `${env.apiUrl}${resourcePath(API_ROUTES.tournaments, openTournament.slug)}`,
            {
              headers: await apiAuthHeaders(),
            },
          );
          expect(response.ok(), `${response.url()} status ${response.status()}`).toBe(true);
          return registrationWindowFrom(await response.json());
        });

        await test.step('When a visitor opens Tournaments', async () => {
          await tournamentsPage.goTo();
        });

        await test.step('And the visitor searches for "Acceptance Open"', async () => {
          await tournamentsPage.searchFor(openTournament.name);
          // "Acceptance Open" is also the start of "Acceptance Opens Later", so the seed implies several cards.
          await tournamentsPage.expectResultCount(seededTournamentsMatching(openTournament.name).length);
        });

        await test.step('And the visitor opens the "Acceptance Open" tournament', async () => {
          await tournamentsPage.openTournament(openTournament.name);
        });

        await test.step('Then the tournament day and the venue are shown', async () => {
          await tournamentPage.expectDayAndVenue(longDay(openTournament.day), openTournament.venue);
        });

        await test.step('And the entry fee is €25.00 per division', async () => {
          await tournamentPage.expectFeePerDivision(openTournamentCard.fee);
        });

        await test.step('And the registration window is shown in Irish time', async () => {
          await tournamentPage.expectRegistrationWindow(
            dublinDateTime(window.registrationOpensAt),
            dublinDateTime(window.registrationClosesAt),
          );
        });

        await test.step('And registration is shown as open', async () => {
          await tournamentPage.expectRegistrationBadge(openTournamentCard.state);
        });

        await test.step('And the divisions are listed in four groups by discipline and gender', async () => {
          await tournamentPage.expectDivisionGroups(SEEDED_TOURNAMENT_OPEN_DIVISION_GROUPS);
        });
      },
    );

    test(
      'visitor should see when registration opens and no sign-up when registration has not opened',
      {
        tag: '@acceptance',
        annotation: squash({ weight: 'medium', status: 'work in progress', nature: 'functional', type: 'regression' }),
      },
      async ({ request, tournamentsPage, tournamentPage }) => {
        const tournament = SEEDED_TOURNAMENT_OPENS_LATER;

        const window = await test.step('Given tournaments are switched on', async () => {
          givenTournamentsSwitchedOn();
          const response = await request.get(`${env.apiUrl}${resourcePath(API_ROUTES.tournaments, tournament.slug)}`, {
            headers: await apiAuthHeaders(),
          });
          expect(response.ok(), `${response.url()} status ${response.status()}`).toBe(true);
          return registrationWindowFrom(await response.json());
        });

        await test.step('When a visitor opens Tournaments', async () => {
          await tournamentsPage.goTo();
        });

        await test.step('And the visitor searches for "Acceptance Opens Later"', async () => {
          await tournamentsPage.searchFor(tournament.name);
          await tournamentsPage.expectResultCount(seededTournamentsMatching(tournament.name).length);
        });

        await test.step('And the visitor opens the "Acceptance Opens Later" tournament', async () => {
          await tournamentsPage.openTournament(tournament.name);
        });

        await test.step('Then the page says registration opens on the seeded opening day', async () => {
          await tournamentPage.expectRegistrationOpensOn(dublinDateTime(window.registrationOpensAt));
        });

        await test.step('And no sign-up is offered', async () => {
          await tournamentPage.expectNoSignUp();
        });
      },
    );

    test(
      'visitor should see that registration is closed and no sign-up when registration has closed',
      {
        tag: '@acceptance',
        annotation: squash({ weight: 'medium', status: 'work in progress', nature: 'functional', type: 'regression' }),
      },
      async ({ tournamentsPage, tournamentPage }) => {
        await test.step('Given tournaments are switched on', () => {
          givenTournamentsSwitchedOn();
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
        });

        await test.step('Then the page says registration is closed', async () => {
          await tournamentPage.expectRegistrationClosedMessage();
        });

        await test.step('And no sign-up is offered', async () => {
          await tournamentPage.expectNoSignUp();
        });
      },
    );

    test.describe('in a time zone far from Ireland', () => {
      test.use({ timezoneId: 'Pacific/Auckland' });

      test(
        'visitor should see registration times in Irish time when the browser is in another time zone',
        {
          tag: '@acceptance',
          annotation: squash({
            weight: 'medium',
            status: 'work in progress',
            nature: 'functional',
            type: 'regression',
          }),
        },
        async ({ request, tournamentsPage, tournamentPage }) => {
          const window = await test.step('Given tournaments are switched on', async () => {
            givenTournamentsSwitchedOn();
            const response = await request.get(
              `${env.apiUrl}${resourcePath(API_ROUTES.tournaments, openTournament.slug)}`,
              {
                headers: await apiAuthHeaders(),
              },
            );
            expect(response.ok(), `${response.url()} status ${response.status()}`).toBe(true);
            return registrationWindowFrom(await response.json());
          });

          // The browser time zone (Pacific/Auckland) is set for this describe with `test.use({ timezoneId })`.
          await test.step('When a visitor opens Tournaments', async () => {
            await tournamentsPage.goTo();
          });

          await test.step('And the visitor searches for "Acceptance Open"', async () => {
            await tournamentsPage.searchFor(openTournament.name);
            await tournamentsPage.expectResultCount(seededTournamentsMatching(openTournament.name).length);
          });

          await test.step('And the visitor opens the "Acceptance Open" tournament', async () => {
            await tournamentsPage.openTournament(openTournament.name);
          });

          await test.step('Then the registration window shows the Irish opening and closing times', async () => {
            await tournamentPage.expectWindowTimes(
              dublinDateTime(window.registrationOpensAt),
              dublinDateTime(window.registrationClosesAt),
            );
          });

          await test.step('And the window is labelled as Irish time', async () => {
            await tournamentPage.expectWindowLabelledIrishTime();
          });
        },
      );
    });
  },
);
