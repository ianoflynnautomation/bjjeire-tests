import type { Page } from '@playwright/test';

export function pageFixture<T>(pageObject: new (page: Page) => T) {
  return async ({ page }: { page: Page }, use: (instance: T) => Promise<void>): Promise<void> => {
    await use(new pageObject(page));
  };
}
