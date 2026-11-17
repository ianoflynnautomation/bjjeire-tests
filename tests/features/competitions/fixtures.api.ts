import { test as core } from '@api/fixtures';
import {
  withLocalCompetitor,
  type CompetitorProfileOptions,
  type LocalCompetitor,
} from '@api/features/competitions/competitor.service';

export type CompetitionsApiOptions = {
  /** Save this profile for the `competitor` fixture; `undefined` signs in without a profile. */
  competitorProfile: CompetitorProfileOptions | undefined;
};

export type CompetitionsApiFixtures = {
  /**
   * A competitor the test owns, for `@local-sign-in` specs: a fresh `pw-<token>@example.test` account signed in through
   * the stack's local route, deleted after the test (rule 5 of the data policy). Creates no sign-up.
   */
  competitor: LocalCompetitor;
};

/** The competitions API chain: `@api/fixtures` plus the competitor. Competitions API specs that need a competitor import this. */
export const test = core.extend<CompetitionsApiOptions & CompetitionsApiFixtures>({
  competitorProfile: [undefined, { option: true }],
  competitor: async ({ playwright, competitorProfile }, use) => {
    await withLocalCompetitor(playwright, competitorProfile, use);
  },
});

export { expect } from '@api/fixtures';
