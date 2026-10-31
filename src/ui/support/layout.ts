import { expect, type Page } from '@playwright/test';

export async function expectNoSidewaysScroll(page: Page): Promise<void> {
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth))
    .toBe(0);
}
