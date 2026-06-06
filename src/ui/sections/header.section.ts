import { expect, type Page } from '@playwright/test';
import { getLocatorByRole, getLocatorByTestId } from '@ui/support';

const navigation = (page: Page) => getLocatorByRole(page, 'navigation');
const logoLink = (page: Page) => getLocatorByTestId(page, 'navigation-logo-link');

export async function expectHeaderVisible(page: Page): Promise<void> {
  await expect(navigation(page)).toBeVisible();
  await expect(logoLink(page)).toBeVisible();
}
