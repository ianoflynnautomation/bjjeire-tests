import { expect } from '@playwright/test';
import { getLocatorByRole, getPage, gotoURL } from '@ui/support/ui';

const main = () => getLocatorByRole('main');

export async function navigate(): Promise<void> {
  await gotoURL(getPage(), '/template');
}

export async function verifyIsLoaded(): Promise<void> {
  await expect(main()).toBeVisible();
}
