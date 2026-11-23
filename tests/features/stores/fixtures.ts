import { mockProductsServerError, mockStores, STORES_ROUTE } from './mocks';
import { ProductPage } from '@ui/pages/stores/product.page';
import { ShopAdminPage } from '@ui/pages/stores/shop-admin.page';
import { StoresPage } from '@ui/pages/stores/stores.page';
import { test as core } from '@ui/fixtures';
import { ALL_FEATURES_ENABLED } from '@ui/fixtures/feature-flags.fixture';
import { failureMockFixtures, type FailureMocks } from '@ui/fixtures/failure.fixture';
import { mockFixture } from '@ui/fixtures/mock-fixture';
import { pageFixture } from '@ui/fixtures/page-fixture';

export type StoresUiFixtures = FailureMocks & {
  storesPage: StoresPage;
  shopAdminPage: ShopAdminPage;
  productPage: ProductPage;
  mockStores: (body: unknown) => Promise<void>;
  mockProductsServerError: () => Promise<void>;
};

export const test = core.extend<StoresUiFixtures>({
  storesPage: pageFixture(StoresPage),
  shopAdminPage: pageFixture(ShopAdminPage),
  productPage: pageFixture(ProductPage),
  mockStores: mockFixture(mockStores),
  mockProductsServerError: mockFixture(mockProductsServerError),
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

/**
 * Option values for `@merch-on` UI specs, used instead of `storesTestConfig`. `Merch` is pinned on so the merch section
 * and product pages render; pair it with `merchSwitchedOnGiven` from `./merch-switched-on-ui`, because the API must
 * also serve the catalogue.
 */
export const merchTestConfig: Parameters<typeof test.use>[0] = {
  ...storesTestConfig,
  featureFlagOverrides: { ...ALL_FEATURES_ENABLED, Merch: true },
};

export { expect } from '@ui/fixtures';
