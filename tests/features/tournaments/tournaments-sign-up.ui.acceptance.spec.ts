// spec: specs/features/tournaments.md
// seed: tests/agents/seed.spec.ts
import { test, expect, tournamentsTestConfig } from './fixtures';
import { z } from 'zod';
import { API_ROUTES, apiAuthHeaders, expectSchema } from '@api/support';
import { env } from '@shared/config';
import {
  SEEDED_TOURNAMENT_OPEN,
  SEEDED_TOURNAMENT_OPEN_WHITE_BELT_MALE_DIVISIONS,
  SEEDED_TOURNAMENT_OPEN_BLUE_BELT_MALE_DIVISIONS,
  SEEDED_TOURNAMENT_OPEN_OTHER_DIVISIONS,
  seededTournamentsMatching,
} from './seeded';
import { tournamentCardFromSeeded } from '@ui/pages/tournaments/tournaments.card.mapper';
import { ALL_FEATURES_ENABLED } from '@ui/fixtures/feature-flags.fixture';
import { squash } from '@squash/annotations';

const featureFlagsSchema = z.object({ Tournaments: z.boolean() });

test.use(tournamentsTestConfig);
test.use({ featureFlagOverrides: { ...ALL_FEATURES_ENABLED, Tournaments: true } });

const openTournament = SEEDED_TOURNAMENT_OPEN;
const openTournamentCard = tournamentCardFromSeeded(openTournament);
const TOURNAMENT_DAY_AGE = 35;
/** Born on 1 January, so the competitor is `TOURNAMENT_DAY_AGE` on the seeded day (under Master 2 at 36), never a fixed date. */
const dateOfBirthAgedOnSeededDay = `${Number(openTournament.day.split('-')[0]) - TOURNAMENT_DAY_AGE}-01-01`;

const ADULT_AGE = 18;
const DATE_LENGTH = 10;
/** Exactly 18 years before the seeded day: 18 on it (the birthday itself counts as 18). */
function dateOfBirthEighteenOn(day: string): string {
  const born = new Date(`${day}T00:00:00Z`);
  born.setUTCFullYear(born.getUTCFullYear() - ADULT_AGE);
  return born.toISOString().slice(0, DATE_LENGTH);
}

/** One day after that cut-off: 17 on the seeded day, turning 18 the next day. */
function dateOfBirthSeventeenOn(day: string): string {
  const born = new Date(`${dateOfBirthEighteenOn(day)}T00:00:00Z`);
  born.setUTCDate(born.getUTCDate() + 1);
  return born.toISOString().slice(0, DATE_LENGTH);
}

// Scenarios that sign a competitor in through the stack's local sign-in (@local-sign-in). None submits the sign-up
// form: a sign-up on a seeded tournament can never be given back.
test.describe(
  'Tournament sign-up UI acceptance',
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

    // The cut-off is the 18th birthday: one day short of it is refused, the birthday itself is allowed.
    test.describe('with a signed-in competitor who is 17 on the tournament day', () => {
      test.use({
        competitorProfile: { gender: 'MALE', belt: 'WHITE', dateOfBirth: dateOfBirthSeventeenOn(openTournament.day) },
      });

      test(
        'competitor should be told they cannot enter when they are 17 on the tournament day',
        {
          tag: ['@acceptance', '@local-sign-in'],
          annotation: squash({
            weight: 'medium',
            status: 'work in progress',
            nature: 'functional',
            type: 'regression',
          }),
        },
        async ({ competitor, tournamentsPage, tournamentPage, competitorSignInPage, signUpPage }) => {
          await test.step('Given tournaments are switched on', () => {
            givenTournamentsSwitchedOn();
          });

          await test.step('And a competitor has signed in with a new email and saved a profile that makes them 17 on the tournament day', async () => {
            await competitorSignInPage.startSignedIn(competitor.session);
          });

          await test.step('When the competitor opens the sign-up for the "Acceptance Open" tournament from its page', async () => {
            await tournamentsPage.goTo();
            await tournamentsPage.searchFor(openTournament.name);
            // "Acceptance Open" is also the start of "Acceptance Opens Later", so the seed implies several cards.
            await tournamentsPage.expectResultCount(seededTournamentsMatching(openTournament.name).length);
            await tournamentsPage.openTournament(openTournament.name);
            await tournamentPage.chooseSignUp();
          });

          // Nothing on the sign-up page is submitted: a sign-up takes a seeded place for good.
          await test.step('Then the competitor is told they must be 18 or over on the tournament day', async () => {
            await signUpPage.expectToldMustBeEighteen();
          });

          await test.step('And no division is offered and nothing can be paid', async () => {
            await signUpPage.expectNothingToChooseOrPay();
          });
        },
      );
    });

    test.describe('with a signed-in competitor who is 18 on the tournament day', () => {
      test.use({
        competitorProfile: { gender: 'MALE', belt: 'WHITE', dateOfBirth: dateOfBirthEighteenOn(openTournament.day) },
      });

      test(
        'competitor should be offered the adult division when they turn 18 on the tournament day',
        {
          tag: ['@acceptance', '@local-sign-in'],
          annotation: squash({
            weight: 'medium',
            status: 'work in progress',
            nature: 'functional',
            type: 'regression',
          }),
        },
        async ({ competitor, tournamentsPage, tournamentPage, competitorSignInPage, signUpPage }) => {
          await test.step('Given tournaments are switched on', () => {
            givenTournamentsSwitchedOn();
          });

          await test.step('And a competitor has signed in with a new email and saved a profile that makes them 18 on the tournament day', async () => {
            await competitorSignInPage.startSignedIn(competitor.session);
          });

          await test.step('When the competitor opens the sign-up for the "Acceptance Open" tournament from its page', async () => {
            await tournamentsPage.goTo();
            await tournamentsPage.searchFor(openTournament.name);
            // "Acceptance Open" is also the start of "Acceptance Opens Later", so the seed implies several cards.
            await tournamentsPage.expectResultCount(seededTournamentsMatching(openTournament.name).length);
            await tournamentsPage.openTournament(openTournament.name);
            await tournamentPage.chooseSignUp();
          });

          // Nothing on the sign-up page is submitted: a sign-up takes a seeded place for good.
          await test.step('Then the adult division is offered', async () => {
            await signUpPage.expectDivisionsOffered(SEEDED_TOURNAMENT_OPEN_WHITE_BELT_MALE_DIVISIONS);
          });

          await test.step('And the competitor is not told they must be 18 or over on the tournament day', async () => {
            await signUpPage.expectNotToldMustBeEighteen();
          });
        },
      );
    });

    test.describe('with a signed-in competitor who has a complete profile and no sign-up', () => {
      test.use({ competitorProfile: { gender: 'MALE', belt: 'WHITE', dateOfBirth: dateOfBirthAgedOnSeededDay } });

      test(
        'competitor should see no sign-ups before signing up for a tournament',
        {
          tag: ['@acceptance', '@local-sign-in'],
          annotation: squash({
            weight: 'medium',
            status: 'work in progress',
            nature: 'functional',
            type: 'regression',
          }),
        },
        async ({ competitor, tournamentsPage, tournamentPage, competitorSignInPage, mySignUpsPage }) => {
          await test.step('Given tournaments are switched on', () => {
            givenTournamentsSwitchedOn();
          });

          await test.step('And a competitor has signed in with a new email and saved a complete profile', async () => {
            await competitorSignInPage.startSignedIn(competitor.session);
          });

          await test.step('When the competitor opens their sign-ups', async () => {
            await tournamentsPage.goTo();
            await tournamentsPage.searchFor(openTournament.name);
            // "Acceptance Open" is also the start of "Acceptance Opens Later", so the seed implies several cards.
            await tournamentsPage.expectResultCount(seededTournamentsMatching(openTournament.name).length);
            await tournamentsPage.openTournament(openTournament.name);
            await tournamentPage.chooseMySignUps();
          });

          await test.step('Then the sign-ups page says the competitor has not signed up for a tournament yet', async () => {
            await mySignUpsPage.expectEmptyMessage();
          });

          await test.step('And no sign-up is listed', async () => {
            await mySignUpsPage.expectNoSignUpsListed();
          });
        },
      );
    });

    test.describe('with a signed-in male blue belt competitor', () => {
      test.use({ competitorProfile: { gender: 'MALE', belt: 'BLUE', dateOfBirth: dateOfBirthAgedOnSeededDay } });

      test(
        'competitor should be offered only the divisions for their gender, belt and age',
        {
          tag: ['@acceptance', '@local-sign-in'],
          annotation: squash({ weight: 'high', status: 'work in progress', nature: 'functional', type: 'regression' }),
        },
        async ({ competitor, tournamentsPage, tournamentPage, competitorSignInPage, signUpPage }) => {
          await test.step('Given tournaments are switched on', () => {
            givenTournamentsSwitchedOn();
          });

          // The fixture's session is seeded before the page loads, so sign-in is not what this scenario is about.
          await test.step('And a competitor has signed in with a new email and saved a complete profile as a male blue belt aged 35 on the tournament day', async () => {
            await competitorSignInPage.startSignedIn(competitor.session);
          });

          await test.step('When the competitor opens the sign-up for the "Acceptance Open" tournament from its page', async () => {
            await tournamentsPage.goTo();
            await tournamentsPage.searchFor(openTournament.name);
            // "Acceptance Open" is also the start of "Acceptance Opens Later", so the seed implies several cards.
            await tournamentsPage.expectResultCount(seededTournamentsMatching(openTournament.name).length);
            await tournamentsPage.openTournament(openTournament.name);
            await tournamentPage.chooseSignUp();
          });

          // Nothing on the sign-up page is submitted: a sign-up takes a seeded place for good.
          await test.step('Then only the blue-belt male adult division is offered', async () => {
            await signUpPage.expectDivisionsOffered(SEEDED_TOURNAMENT_OPEN_BLUE_BELT_MALE_DIVISIONS);
          });

          await test.step('And no division for another gender or belt is offered', async () => {
            await signUpPage.expectDivisionsNotOffered(SEEDED_TOURNAMENT_OPEN_OTHER_DIVISIONS);
          });

          await test.step('And the entry fee €25.00 is shown before paying', async () => {
            await signUpPage.expectEntryFee(openTournamentCard.fee);
          });
        },
      );
    });

    test.describe('with a signed-out visitor who has a complete competitor profile', () => {
      // True by construction: no stored sign-in, so the browser holds no competitor account whatever the environment.
      test.use({ storageState: { cookies: [], origins: [] } });
      test.use({ competitorProfile: { gender: 'MALE', belt: 'WHITE', dateOfBirth: '1990-01-01' } });

      test(
        'visitor should be asked to sign in and come back to the sign-up when signing up for a tournament',
        {
          tag: ['@acceptance', '@local-sign-in'],
          annotation: squash({ weight: 'high', status: 'work in progress', nature: 'functional', type: 'regression' }),
        },
        async ({ competitor, tournamentsPage, tournamentPage, competitorSignInPage, signUpPage }) => {
          await test.step('Given tournaments are switched on', () => {
            givenTournamentsSwitchedOn();
          });

          // The fixture signs the competitor in over the API only, so the browser holds no session.
          await test.step('And a visitor is not signed in', async () => {
            await tournamentsPage.goTo();
          });

          await test.step('When the visitor chooses Sign up on a tournament whose registration is open', async () => {
            await tournamentsPage.searchFor(openTournament.name);
            // "Acceptance Open" is also the start of "Acceptance Opens Later", so the seed implies several cards.
            await tournamentsPage.expectResultCount(seededTournamentsMatching(openTournament.name).length);
            await tournamentsPage.openTournament(openTournament.name);
            await tournamentPage.chooseSignUp();
            await competitorSignInPage.expectAskedToSignIn();
          });

          await test.step('And the visitor signs in as a competitor with a complete profile', async () => {
            await competitorSignInPage.signInWithEmail(competitor.email);
          });

          // Nothing on the sign-up page is submitted: a sign-up takes a seeded place for good.
          await test.step('Then the visitor is on the sign-up for that tournament', async () => {
            await signUpPage.expectForTournament(openTournament.name);
          });

          await test.step('And the divisions they may enter are offered', async () => {
            await signUpPage.expectDivisionsOffered(SEEDED_TOURNAMENT_OPEN_WHITE_BELT_MALE_DIVISIONS);
          });
        },
      );
    });
  },
);
