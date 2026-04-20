import { test as base } from '@playwright/test';
import { createNavBar, type NavBar } from '@shared/ui';

export type NavigationFixtures = {
  navBar: NavBar;
};

export const test = base.extend<NavigationFixtures>({
  navBar: async ({ page }, use) => {
    await use(createNavBar(page));
  },
});
