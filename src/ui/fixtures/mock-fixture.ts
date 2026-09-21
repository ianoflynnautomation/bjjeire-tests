import type { Page } from '@playwright/test';

/**
 * Hands a spec a route-mock helper with `page` already applied.
 *
 * The `{ page }` destructuring must stay literal in the returned arrow:
 * Playwright reads a fixture's dependencies from its source text, so a factory
 * that hid it would never be given a page.
 */
export function mockFixture<A extends unknown[]>(mock: (page: Page, ...args: A) => Promise<void>) {
  return async ({ page }: { page: Page }, use: (fn: (...args: A) => Promise<void>) => Promise<void>): Promise<void> => {
    await use((...args: A) => mock(page, ...args));
  };
}

/**
 * Hands a spec a page object constructed for the test's page. `pageObject` is a
 * constructor (lower-cased only to satisfy the parameter naming rule).
 */
export function pageFixture<T>(pageObject: new (page: Page) => T) {
  return async ({ page }: { page: Page }, use: (instance: T) => Promise<void>): Promise<void> => {
    await use(new pageObject(page));
  };
}
