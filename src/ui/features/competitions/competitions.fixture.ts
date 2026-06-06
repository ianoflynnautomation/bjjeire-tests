import { test as base } from '@playwright/test';
import { bindPage, type BoundPageObject } from '@ui/fixtures/bind-page';
import * as CompetitionsPageMod from '@ui/pages/competitions/competitions.page';

export type CompetitionsPage = BoundPageObject<typeof CompetitionsPageMod>;

export const test = base.extend<{ competitionsPage: CompetitionsPage }>({
  competitionsPage: async ({ page }, use) => {
    await use(bindPage(CompetitionsPageMod, page));
  },
});
