import { test as base } from '@playwright/test';
import type { Page, TestInfo } from '@playwright/test';
import { LoginPage } from '../pages/login-page';
import { ProductsPage } from '../pages/products-page';

export type PageFixtures = {
  loginPage: LoginPage;
  productsPage: ProductsPage;
};

export type HookOptions = {
  /** Runs after the page is created, before the test body executes. */
  beforeEachFn: ((page: Page, testInfo: TestInfo) => Promise<void>) | null;
  /** Runs after the test body finishes, even on failure. */
  afterEachFn: ((page: Page, testInfo: TestInfo) => Promise<void>) | null;
};

export const test = base.extend<PageFixtures & HookOptions>({
  beforeEachFn: [null, { option: true }],
  afterEachFn: [null, { option: true }],

  page: async ({ page, beforeEachFn, afterEachFn }, use, testInfo) => {
    if (beforeEachFn) await beforeEachFn(page, testInfo);
    await use(page);
    if (afterEachFn) await afterEachFn(page, testInfo);
  },

  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
  productsPage: async ({ page }, use) => {
    await use(new ProductsPage(page));
  },
});

export { expect } from '@playwright/test';
