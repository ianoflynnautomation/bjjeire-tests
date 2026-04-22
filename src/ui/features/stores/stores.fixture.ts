import { test as base } from '@playwright/test';
import { createStoresScreen, type StoresScreen } from './stores.screen';

export type StoresFixtures = {
  storesScreen: StoresScreen;
};

export const test = base.extend<StoresFixtures>({
  storesScreen: async ({ page }, use) => {
    await use(createStoresScreen(page));
  },
});
