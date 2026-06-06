import { test as base } from '@playwright/test';
import { bindPage, type BoundPageObject } from '@ui/fixtures/bind-page';
import * as GymsPageMod from '@ui/pages/gyms/gyms.page';

export type GymsPage = BoundPageObject<typeof GymsPageMod>;

export const test = base.extend<{ gymsPage: GymsPage }>({
  gymsPage: async ({ page }, use) => {
    await use(bindPage(GymsPageMod, page));
  },
});
