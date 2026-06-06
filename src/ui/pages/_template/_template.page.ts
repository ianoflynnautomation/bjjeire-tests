import type { Page } from '@playwright/test';
import { expectPageToHaveURL, expectVisible, getLocatorByRole, goToPage } from '@ui/support';

const main = (page: Page) => getLocatorByRole(page, 'main');

export async function navigate(page: Page): Promise<void> {
  await goToPage(page, '/template');
}

export async function verifyIsLoaded(page: Page): Promise<void> {
  await expectPageToHaveURL(page, /\/template$/);
  await expectVisible(main(page));
}
