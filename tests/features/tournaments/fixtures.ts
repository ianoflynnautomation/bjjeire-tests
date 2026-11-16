import {
  withLocalCompetitor,
  type CompetitorProfileOptions,
  type LocalCompetitor,
} from '@api/features/tournaments/competitor.service';
import { CompetitorSignInPage } from '@ui/pages/tournaments/competitor-sign-in.page';
import { CompetitorProfilePage } from '@ui/pages/tournaments/competitor-profile.page';
import { MySignUpsPage } from '@ui/pages/tournaments/my-sign-ups.page';
import { SignUpPage } from '@ui/pages/tournaments/sign-up.page';
import { TournamentAdminPage } from '@ui/pages/tournaments/tournament-admin.page';
import { TournamentPage } from '@ui/pages/tournaments/tournament.page';
import { TournamentsPage } from '@ui/pages/tournaments/tournaments.page';
import { test as core, expect } from '@ui/fixtures';
import { SIGN_UP_SUBMIT_ROUTES } from '@ui/pages/tournaments/tournaments.constants';
import { pageFixture } from '@ui/fixtures/page-fixture';

export type TournamentsUiFixtures = {
  tournamentsPage: TournamentsPage;
  tournamentPage: TournamentPage;
  tournamentAdminPage: TournamentAdminPage;
  competitorSignInPage: CompetitorSignInPage;
  signUpPage: SignUpPage;
  mySignUpsPage: MySignUpsPage;
  competitorProfilePage: CompetitorProfilePage;
  /** A competitor the test owns, for `@local-sign-in` specs: signed in, optionally with a profile, deleted afterwards. */
  competitor: LocalCompetitor;
};

export type TournamentsUiOptions = {
  /** Save this profile for the fixture's competitor; `undefined` signs in without a profile. */
  competitorProfile: CompetitorProfileOptions | undefined;
};

export const test = core.extend<TournamentsUiFixtures & TournamentsUiOptions>({
  competitorProfile: [undefined, { option: true }],
  // Guard: a sign-up takes a seeded place that cannot be given back (data policy rule 5), so every test that holds a
  // competitor has POSTs to the sign-up and checkout routes aborted, and fails if the page tried to send one.
  competitor: async ({ page, playwright, competitorProfile }, use) => {
    const blocked: string[] = [];
    await page.route(SIGN_UP_SUBMIT_ROUTES, async route => {
      if (route.request().method() !== 'POST') return route.fallback();
      blocked.push(route.request().url());
      return route.abort();
    });
    await withLocalCompetitor(playwright, competitorProfile, async competitor => {
      await use(competitor);
      expect(blocked, 'a UI test must never submit a sign-up: it takes a seeded place for good').toEqual([]);
    });
  },
  tournamentsPage: pageFixture(TournamentsPage),
  tournamentPage: pageFixture(TournamentPage),
  tournamentAdminPage: pageFixture(TournamentAdminPage),
  competitorSignInPage: pageFixture(CompetitorSignInPage),
  signUpPage: pageFixture(SignUpPage),
  mySignUpsPage: pageFixture(MySignUpsPage),
  competitorProfilePage: pageFixture(CompetitorProfilePage),
});

/**
 * Option values every tournaments UI spec runs with — each of them calls
 * `test.use(tournamentsTestConfig)`. Tournaments is off unless an environment
 * enables it, so a spec that needs it on sets it here or in the file.
 */
export const tournamentsTestConfig: Parameters<typeof test.use>[0] = {};

export { expect } from '@ui/fixtures';
