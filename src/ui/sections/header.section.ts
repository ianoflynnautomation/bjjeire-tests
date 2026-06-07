import { expect, type Page } from '@playwright/test';

const navigation = (page: Page) => page.getByRole('navigation');
const logoLink = (page: Page) => page.getByTestId('navigation-logo-link');

export async function expectHeaderVisible(page: Page): Promise<void> {
  await expect(navigation(page)).toBeVisible();
  await expect(logoLink(page)).toBeVisible();
}
