// spec: specs/features/tournaments.md
// seed: tests/agents/seed.spec.ts
import { test, expect, tournamentsTestConfig } from './fixtures';
import { z } from 'zod';
import { API_ROUTES, apiAuthHeaders, expectSchema } from '@api/support';
import { env } from '@shared/config';
import {
  SEEDED_TOURNAMENT_CLOSED,
  SEEDED_TOURNAMENT_CLOSED_PARTIAL_NAME,
  SEEDED_TOURNAMENT_OPEN,
  NO_MATCH_SEARCH_TERM,
  seededTournamentsMatching,
  SEEDED_TOURNAMENTS,
} from './seeded';
import { longDay } from './dublin-time';
import { tournamentCardFromSeeded } from '@ui/pages/tournaments/tournaments.card.mapper';
import { ALL_FEATURES_ENABLED } from '@ui/fixtures/feature-flags.fixture';
import { HEADER_NAV_LINKS, HEADER_NAV_LINKS_TOURNAMENTS_ON } from '@ui/pages/sections/header.constants';
import { gotoAppShell } from '@ui/support';
import { squash } from '@squash/annotations';

const featureFlagsSchema = z.object({ Tournaments: z.boolean() });

test.use(tournamentsTestConfig);

// Tournaments is off unless an environment enables it; state it rather than rely on the default.
test.use({ featureFlagOverrides: { ...ALL_FEATURES_ENABLED, Tournaments: false } });

const seededTournament = SEEDED_TOURNAMENT_CLOSED;
const seededTournamentCard = tournamentCardFromSeeded(seededTournament);
const openTournament = SEEDED_TOURNAMENT_OPEN;
const openTournamentCard = tournamentCardFromSeeded(openTournament);
const UNKNOWN_TOURNAMENT_SLUG = 'does-not-exist';

test.describe('Tournaments UI acceptance', { tag: ['@tournaments', '@ui', '@desktop', '@squash'] }, () => {
  test(
    'visitor should see no tournament or account entry when tournaments are switched off',
    {
      tag: '@acceptance',
      annotation: squash({ weight: 'medium', status: 'work in progress', nature: 'functional', type: 'regression' }),
    },
    async ({ page, headerSection }) => {
      await test.step('When a visitor opens the site', async () => {
        await gotoAppShell(page, '/');
      });

      await test.step('Then the navigation lists Events, Gyms, Competitions, Stores and About', async () => {
        await headerSection.expectPageLinks(HEADER_NAV_LINKS.map(link => link.name));
      });

      await test.step('And the navigation has no tournament entry', async () => {
        await headerSection.expectNoTournamentEntry();
      });

      await test.step('And the navigation has no sign-in or account entry', async () => {
        await headerSection.expectNoAccountEntry();
      });
    },
  );

  test.describe('with tournaments switched on', { tag: '@tournaments-on' }, () => {
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

    test.use({ featureFlagOverrides: { ...ALL_FEATURES_ENABLED, Tournaments: true } });

    test(
      'visitor should find a published tournament in the tournament list',
      {
        tag: ['@smoke', '@acceptance'],
        annotation: squash({ weight: 'high', status: 'work in progress', nature: 'functional', type: 'regression' }),
      },
      async ({ tournamentsPage }) => {
        await test.step('Given tournaments are switched on', () => {
          givenTournamentsSwitchedOn();
        });

        await test.step('When a visitor opens Tournaments', async () => {
          await tournamentsPage.goTo();
        });

        await test.step('And the visitor searches for "Acceptance Closed"', async () => {
          await tournamentsPage.searchFor(SEEDED_TOURNAMENT_CLOSED_PARTIAL_NAME);
          await tournamentsPage.expectResultCount(1);
        });

        await test.step('Then the seeded tournament is listed with its date, venue and entry fee', async () => {
          await tournamentsPage.expectCardData({
            name: seededTournamentCard.name,
            date: seededTournamentCard.date,
            venue: seededTournamentCard.venue,
            fee: seededTournamentCard.fee,
          });
        });

        await test.step('And it is marked as closed for registration', async () => {
          await tournamentsPage.expectCardData({ name: seededTournamentCard.name, state: seededTournamentCard.state });
        });
      },
    );

    test(
      'visitor should see a tournament entry in the navigation when tournaments are switched on',
      {
        tag: '@acceptance',
        annotation: squash({ weight: 'medium', status: 'work in progress', nature: 'functional', type: 'regression' }),
      },
      async ({ page, headerSection, tournamentsPage }) => {
        await test.step('Given tournaments are switched on', () => {
          givenTournamentsSwitchedOn();
        });

        await test.step('When a visitor opens the site', async () => {
          await gotoAppShell(page, '/');
        });

        await test.step('And the visitor chooses the Tournaments entry', async () => {
          await headerSection.openPage('Tournaments');
        });

        await test.step('Then the navigation lists Events, Gyms, Competitions, Stores, Tournaments and About', async () => {
          await headerSection.expectPageLinks(HEADER_NAV_LINKS_TOURNAMENTS_ON.map(link => link.name));
        });

        await test.step('And the tournament list is shown', async () => {
          await tournamentsPage.verifyIsLoaded();
        });
      },
    );

    test(
      'visitor should see no results when no tournament matches the search',
      {
        tag: '@acceptance',
        annotation: squash({ weight: 'medium', status: 'work in progress', nature: 'functional', type: 'regression' }),
      },
      async ({ tournamentsPage }) => {
        await test.step('Given tournaments are switched on', () => {
          givenTournamentsSwitchedOn();
        });

        await test.step('When a visitor opens Tournaments', async () => {
          await tournamentsPage.goTo();
        });

        await test.step('And the visitor searches for a name no tournament has', async () => {
          await tournamentsPage.searchFor(NO_MATCH_SEARCH_TERM);
        });

        await test.step('Then no tournament is listed', async () => {
          await tournamentsPage.expectResultCount(0);
        });

        await test.step('And a no-results message is shown', async () => {
          await tournamentsPage.expectNoResults();
        });
      },
    );

    test(
      "visitor should see a tournament's details when opening its address directly",
      {
        tag: '@acceptance',
        annotation: squash({ weight: 'medium', status: 'work in progress', nature: 'functional', type: 'regression' }),
      },
      async ({ tournamentPage }) => {
        await test.step('Given tournaments are switched on', () => {
          givenTournamentsSwitchedOn();
        });

        await test.step('When a visitor opens the address of the "Acceptance Open" tournament directly', async () => {
          await tournamentPage.goToAddress(openTournament.slug);
        });

        await test.step("Then the tournament's name is shown", async () => {
          await tournamentPage.expectName(openTournament.name);
        });

        await test.step('And the tournament day and the venue are shown', async () => {
          await tournamentPage.expectDayAndVenue(longDay(openTournament.day), openTournament.venue);
        });
      },
    );

    test(
      'visitor should see a tournament is not found when opening the address of one that does not exist',
      {
        tag: '@acceptance',
        annotation: squash({ weight: 'medium', status: 'work in progress', nature: 'functional', type: 'regression' }),
      },
      async ({ tournamentPage }) => {
        await test.step('Given tournaments are switched on', () => {
          givenTournamentsSwitchedOn();
        });

        await test.step('When a visitor opens the address of a tournament that does not exist directly', async () => {
          await tournamentPage.goToUnknownAddress(UNKNOWN_TOURNAMENT_SLUG);
        });

        await test.step('Then the page says the tournament was not found', async () => {
          await tournamentPage.expectNotFound();
        });

        await test.step('And a link back to the tournament list is offered', async () => {
          await tournamentPage.expectBackLinkToList();
        });
      },
    );

    test(
      'visitor should see how many divisions a tournament has on its list card',
      {
        tag: '@acceptance',
        annotation: squash({ weight: 'medium', status: 'work in progress', nature: 'functional', type: 'regression' }),
      },
      async ({ tournamentsPage }) => {
        await test.step('Given tournaments are switched on', () => {
          givenTournamentsSwitchedOn();
        });

        await test.step('When a visitor opens Tournaments', async () => {
          await tournamentsPage.goTo();
        });

        await test.step('And the visitor searches for "Acceptance Open"', async () => {
          await tournamentsPage.searchFor(openTournament.name);
          // Two cards: the search also matches "Acceptance Opens Later"; the Then step picks the exact-name card.
          await tournamentsPage.expectResultCount(seededTournamentsMatching(openTournament.name).length);
        });

        await test.step('Then the "Acceptance Open" card says it has 5 divisions', async () => {
          await tournamentsPage.expectCardData({
            name: openTournamentCard.name,
            divisionCount: openTournamentCard.divisionCount,
          });
        });
      },
    );

    test(
      'visitor should see the number of tournaments in the list header matching the tournaments listed',
      {
        tag: '@acceptance',
        annotation: squash({ weight: 'medium', status: 'work in progress', nature: 'functional', type: 'regression' }),
      },
      async ({ tournamentsPage }) => {
        await test.step('Given tournaments are switched on', () => {
          givenTournamentsSwitchedOn();
        });

        await test.step('When a visitor opens Tournaments', async () => {
          await tournamentsPage.goTo();
        });

        await test.step('Then the header total equals the number of tournaments listed', async () => {
          await tournamentsPage.expectHeaderTotalMatchesListedCards({ atLeast: SEEDED_TOURNAMENTS.length });
        });
      },
    );

    test.describe('with no organiser sign-in', () => {
      // True by construction: no stored sign-in, so the browser holds no organiser account whatever the environment.
      test.use({ storageState: { cookies: [], origins: [] } });

      test(
        'visitor should be asked to sign in as an organiser when opening tournament management',
        {
          tag: '@acceptance',
          annotation: squash({
            weight: 'medium',
            status: 'work in progress',
            nature: 'functional',
            type: 'regression',
          }),
        },
        async ({ headerSection, tournamentAdminPage }) => {
          await test.step('Given tournaments are switched on', () => {
            givenTournamentsSwitchedOn();
          });

          await test.step('When a visitor with no organiser sign-in opens tournament management', async () => {
            await tournamentAdminPage.goTo();
          });

          await test.step('Then the organiser sign-in prompt is shown', async () => {
            await tournamentAdminPage.expectSignInPrompt();
          });

          await test.step('And no tournament is listed', async () => {
            await tournamentAdminPage.expectNoTournamentListed();
          });

          await test.step('And the navigation has no management entry', async () => {
            await headerSection.expectPageLinks(HEADER_NAV_LINKS_TOURNAMENTS_ON.map(link => link.name));
          });
        },
      );
    });
  });
});
