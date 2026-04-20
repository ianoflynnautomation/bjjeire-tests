import { test as base } from '@playwright/test';
import { createAboutScreen, type AboutScreen } from './about.screen';

export type AboutFixtures = {
  aboutScreen: AboutScreen;
};

export const test = base.extend<AboutFixtures>({
  aboutScreen: async ({ page }, use) => {
    await use(createAboutScreen(page));
  },
});
