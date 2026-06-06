import { test as base } from '@playwright/test';
import { bindPage, type BoundPageObject } from '@ui/fixtures/bind-page';
import * as StoresPageMod from '@ui/pages/stores/stores.page';

export type StoresPage = BoundPageObject<typeof StoresPageMod>;

export const test = base.extend<{ storesPage: StoresPage }>({
  storesPage: async ({ page }, use) => {
    await use(bindPage(StoresPageMod, page));
  },
});
