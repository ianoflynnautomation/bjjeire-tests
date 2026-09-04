import { expect, type Page } from '@playwright/test';
import { gotoRoute, waitForRouteMounted } from '@ui/support';

const main = (page: Page) => page.getByRole('main');

export async function navigate(page: Page): Promise<void> {
  await gotoRoute(page, '/template', main(page));
}

export async function verifyIsLoaded(page: Page): Promise<void> {
  await waitForRouteMounted(main(page));
  await expect(page).toHaveURL(/\/template$/);
  await expect(main(page)).toBeVisible();
}
