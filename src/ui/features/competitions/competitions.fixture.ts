import { test as base } from '@playwright/test';
import { createCompetitionsScreen, type CompetitionsScreen } from './competitions.screen';

export type CompetitionsFixtures = {
  competitionsScreen: CompetitionsScreen;
};

export const test = base.extend<CompetitionsFixtures>({
  competitionsScreen: async ({ page }, use) => {
    await use(createCompetitionsScreen(page));
  },
});
