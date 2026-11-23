import { expect, type Locator, type Page } from '@playwright/test';

export async function expectNoSidewaysScroll(page: Page): Promise<void> {
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth))
    .toBe(0);
}

/** The image has loaded and decoded (a broken or blocked source has no natural width). */
export async function expectImageLoaded(image: Locator): Promise<void> {
  await expect(image).toBeVisible();
  await expect.poll(() => image.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true);
}
