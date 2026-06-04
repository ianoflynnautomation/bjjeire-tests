import { getLocatorByRole, getLocatorByTestId } from '@ui/support';
import { expect } from 'playwright/test';

const navigation = () => getLocatorByRole('navigation');
const logoLink = () => getLocatorByTestId('navigation-logo-link');

export async function expectHeaderVisible(): Promise<void> {
  await expect(navigation()).toBeVisible();
  await expect(logoLink()).toBeVisible();
}
