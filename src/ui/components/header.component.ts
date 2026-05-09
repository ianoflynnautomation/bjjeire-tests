import { expect, type Locator } from '@playwright/test';
import { getPage } from '@ui/support/ui';

export const navigation = (): Locator => getPage().getByRole('navigation');
export const logoLink = (): Locator => getPage().getByTestId('navigation-logo-link');

export async function expectVisible(): Promise<void> {
  await expect(navigation()).toBeVisible();
  await expect(logoLink()).toBeVisible();
}
