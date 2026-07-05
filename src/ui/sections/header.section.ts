import { expect, type Page } from '@playwright/test';

const navigation = (page: Page) => page.getByRole('navigation');
const logoLink = (page: Page) => page.getByTestId('navigation-logo-link');
const supportModalButton = (page: Page) => page.getByTestId('navigation-support-button');

export async function expectHeaderVisible(page: Page): Promise<void> {
  await expect(navigation(page)).toBeVisible();
  await expect(logoLink(page)).toBeVisible();
}

export async function clickSupportButton(page: Page) {
  await supportModalButton(page).click();
  await expect(page.getByTestId('support-modal-content')).toBeVisible();
}
