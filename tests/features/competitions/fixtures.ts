import {
  mockBjjEireCompetitions,
  mockBjjEireCompetitionsServerError,
  mockCompetitions,
  mockCompetitionsPages,
  COMPETITIONS_ROUTE,
} from './mocks';
import {
  withLocalCompetitor,
  type CompetitorProfileOptions,
  type LocalCompetitor,
} from '@api/features/competitions/competitor.service';
import { BjjEireCompetitionAdminPage } from '@ui/pages/competitions/bjjeire-competition-admin.page';
import { BjjEireCompetitionPage } from '@ui/pages/competitions/bjjeire-competition.page';
import { CompetitionsPage } from '@ui/pages/competitions/competitions.page';
import { CompetitorProfilePage } from '@ui/pages/competitions/competitor-profile.page';
import { CompetitorSignInPage } from '@ui/pages/competitions/competitor-sign-in.page';
import { MySignUpsPage } from '@ui/pages/competitions/my-sign-ups.page';
import { SignUpPage } from '@ui/pages/competitions/sign-up.page';
import { SIGN_UP_SUBMIT_ROUTES } from '@ui/pages/competitions/competitions.constants';
import { test as core, expect } from '@ui/fixtures';
import { failureMockFixtures, type FailureMocks } from '@ui/fixtures/failure.fixture';
import { ALL_FEATURES_ENABLED } from '@ui/fixtures/feature-flags.fixture';
import { mockFixture } from '@ui/fixtures/mock-fixture';
import { pageFixture } from '@ui/fixtures/page-fixture';

export type CompetitionsUiFixtures = FailureMocks & {
  bjjEireCompetitionPage: BjjEireCompetitionPage;
  bjjEireCompetitionAdminPage: BjjEireCompetitionAdminPage;
  competitionsPage: CompetitionsPage;
  competitorSignInPage: CompetitorSignInPage;
  competitorProfilePage: CompetitorProfilePage;
  signUpPage: SignUpPage;
  mySignUpsPage: MySignUpsPage;
  mockBjjEireCompetitions: (body: unknown) => Promise<void>;
  mockBjjEireCompetitionsServerError: () => Promise<void>;
  mockCompetitions: (body: unknown) => Promise<void>;
  mockCompetitionsPages: (bodiesByPage: Readonly<Record<number, unknown>>) => Promise<void>;
  /** A competitor the test owns, for `@local-sign-in` specs: signed in, optionally with a profile, deleted afterwards. */
  competitor: LocalCompetitor;
};

export type CompetitionsUiOptions = {
  /** Save this profile for the fixture's competitor; `undefined` signs in without a profile. */
  competitorProfile: CompetitorProfileOptions | undefined;
};

export const test = core.extend<CompetitionsUiFixtures & CompetitionsUiOptions>({
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
  bjjEireCompetitionPage: pageFixture(BjjEireCompetitionPage),
  bjjEireCompetitionAdminPage: pageFixture(BjjEireCompetitionAdminPage),
  competitionsPage: pageFixture(CompetitionsPage),
  competitorSignInPage: pageFixture(CompetitorSignInPage),
  competitorProfilePage: pageFixture(CompetitorProfilePage),
  signUpPage: pageFixture(SignUpPage),
  mySignUpsPage: pageFixture(MySignUpsPage),
  mockBjjEireCompetitions: mockFixture(mockBjjEireCompetitions),
  mockBjjEireCompetitionsServerError: mockFixture(mockBjjEireCompetitionsServerError),
  mockCompetitions: mockFixture(mockCompetitions),
  mockCompetitionsPages: mockFixture(mockCompetitionsPages),
  ...failureMockFixtures(COMPETITIONS_ROUTE),
});

/**
 * Option values every competitions spec runs with — each of them calls
 * `test.use(competitionsTestConfig)`. `BjjEireCompetitions` is pinned on so the featured section, the BJJ Éire
 * competition pages and the account entry never depend on the environment's flag fetch; a spec that needs the flag
 * off in the browser sets it to `false` in its own `featureFlagOverrides`.
 * Put anything the whole feature needs here (`viewport`, `colorScheme`,
 * `featureFlagOverrides`, `timezoneId`, …) and every competitions spec picks it up
 * without being edited. The type is derived from this feature's own `test`, so
 * it accepts the core options plus any option this file later declares.
 */
export const competitionsTestConfig: Parameters<typeof test.use>[0] = {
  featureFlagOverrides: { ...ALL_FEATURES_ENABLED, BjjEireCompetitions: true },
};

export { expect } from '@ui/fixtures';
