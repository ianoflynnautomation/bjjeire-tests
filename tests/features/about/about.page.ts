import { expect, type Page } from '@playwright/test';
import { gotoURL } from '@lib/ui';

export type AboutPage = Readonly<{
  navigate: () => Promise<void>;
  verifyIsLoaded: () => Promise<void>;
}>;

export function createAboutPage(page: Page): AboutPage {
  return {
    async navigate() {
      await gotoURL(page, '/about');
    },
    async verifyIsLoaded() {
      await expect(page).toHaveURL(/\/about$/);
      await expect(page.locator('main')).toBeVisible();
    },
  };
}
