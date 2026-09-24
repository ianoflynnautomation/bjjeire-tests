import { mockCompetitions, mockCompetitionsPages, COMPETITIONS_ROUTE } from './mocks';
import { CompetitionsPage } from '@ui/pages/competitions/competitions.page';
import { test as core } from '@ui/fixtures';
import { failureMockFixtures, type FailureMocks } from '@ui/fixtures/failure.fixture';
import { mockFixture, pageFixture } from '@ui/fixtures/mock-fixture';

export type CompetitionsUiFixtures = FailureMocks & {
  competitionsPage: CompetitionsPage;
  mockCompetitions: (body: unknown) => Promise<void>;
  mockCompetitionsPages: (bodiesByPage: Readonly<Record<number, unknown>>) => Promise<void>;
};

export const test = core.extend<CompetitionsUiFixtures>({
  competitionsPage: pageFixture(CompetitionsPage),
  mockCompetitions: mockFixture(mockCompetitions),
  mockCompetitionsPages: mockFixture(mockCompetitionsPages),
  ...failureMockFixtures(COMPETITIONS_ROUTE),
});

/**
 * Option values every competitions spec runs with — each of them calls
 * `test.use(competitionsTestConfig)`. Intentionally empty: the defaults suit competitions today.
 * Put anything the whole feature needs here (`viewport`, `colorScheme`,
 * `featureFlagOverrides`, `timezoneId`, …) and every competitions spec picks it up
 * without being edited. The type is derived from this feature's own `test`, so
 * it accepts the core options plus any option this file later declares.
 */
export const competitionsTestConfig: Parameters<typeof test.use>[0] = {};

export { expect } from '@ui/fixtures';
