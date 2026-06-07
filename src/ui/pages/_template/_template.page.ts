import { expect, type Page } from '@playwright/test';

const main = (page: Page) => page.getByRole('main');

export async function navigate(page: Page): Promise<void> {
  await page.goto('/template');
}

export async function verifyIsLoaded(page: Page): Promise<void> {
  await expect(page).toHaveURL(/\/template$/);
  await expect(main(page)).toBeVisible();
}
