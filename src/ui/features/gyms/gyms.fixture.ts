import { test as base } from '@playwright/test';
import { createGymsScreen, type GymsScreen } from './gyms.screen';

export type GymsFixtures = {
  gymsScreen: GymsScreen;
};

export const test = base.extend<GymsFixtures>({
  gymsScreen: async ({ page }, use) => {
    await use(createGymsScreen(page));
  },
});
