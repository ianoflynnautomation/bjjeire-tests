import type { Page } from '@playwright/test';

export function mockFixture<A extends unknown[]>(mock: (page: Page, ...args: A) => Promise<void>) {
  return async ({ page }: { page: Page }, use: (fn: (...args: A) => Promise<void>) => Promise<void>): Promise<void> => {
    await use((...args: A) => mock(page, ...args));
  };
}
