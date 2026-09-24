import { mockStores, STORES_ROUTE } from './mocks';
import { StoresPage } from '@ui/pages/stores/stores.page';
import { test as core } from '@ui/fixtures';
import { failureMockFixtures, type FailureMocks } from '@ui/fixtures/failure.fixture';
import { mockFixture, pageFixture } from '@ui/fixtures/mock-fixture';

export type StoresUiFixtures = FailureMocks & {
  storesPage: StoresPage;
  mockStores: (body: unknown) => Promise<void>;
};

export const test = core.extend<StoresUiFixtures>({
  storesPage: pageFixture(StoresPage),
  mockStores: mockFixture(mockStores),
  ...failureMockFixtures(STORES_ROUTE),
});

/**
 * Option values every stores spec runs with — each of them calls
 * `test.use(storesTestConfig)`. Intentionally empty: the defaults suit stores today.
 * Put anything the whole feature needs here (`viewport`, `colorScheme`,
 * `featureFlagOverrides`, `timezoneId`, …) and every stores spec picks it up
 * without being edited. The type is derived from this feature's own `test`, so
 * it accepts the core options plus any option this file later declares.
 */
export const storesTestConfig: Parameters<typeof test.use>[0] = {};

export { expect } from '@ui/fixtures';
