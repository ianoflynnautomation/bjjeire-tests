import { test as base } from '@playwright/test';
import { bindPage, type BoundPageObject } from '@ui/fixtures/bind-page';
import * as AboutPageMod from '@ui/pages/about/about.page';

export type AboutPage = BoundPageObject<typeof AboutPageMod>;

export const test = base.extend<{ aboutPage: AboutPage }>({
  aboutPage: async ({ page }, use) => {
    await use(bindPage(AboutPageMod, page));
  },
});
