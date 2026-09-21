import { mockGyms, GYMS_ROUTE } from './mocks';
import { GymsPage } from '@ui/pages/gyms/gyms.page';
import { test as core } from '@ui/fixtures';
import { failureMockFixtures, type FailureMocks } from '@ui/fixtures/failure.fixture';
import { mockFixture, pageFixture } from '@ui/fixtures/mock-fixture';

export type GymsUiFixtures = FailureMocks & {
  gymsPage: GymsPage;
  mockGyms: (body: unknown) => Promise<void>;
};

export const test = core.extend<GymsUiFixtures>({
  gymsPage: pageFixture(GymsPage),
  mockGyms: mockFixture(mockGyms),
  ...failureMockFixtures(GYMS_ROUTE),
});

/**
 * Option values every gyms spec runs with — each of them calls
 * `test.use(gymsTestConfig)`. Intentionally empty: the defaults suit gyms today.
 * Put anything the whole feature needs here (`viewport`, `colorScheme`,
 * `featureFlagOverrides`, `timezoneId`, …) and every gyms spec picks it up
 * without being edited. The type is derived from this feature's own `test`, so
 * it accepts the core options plus any option this file later declares.
 */
export const gymsTestConfig: Parameters<typeof test.use>[0] = {};

export { expect } from '@ui/fixtures';
