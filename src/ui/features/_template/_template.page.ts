import { expect } from '@playwright/test';
import { getPage, gotoURL } from '@ui/support/ui';

const main = () => getPage().getByRole('main');

export async function navigate(): Promise<void> {
  await gotoURL(getPage(), '/template');
}

export async function verifyIsLoaded(): Promise<void> {
  await expect(main()).toBeVisible();
}
