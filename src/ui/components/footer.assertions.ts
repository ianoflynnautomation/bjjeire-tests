import { expect } from '@playwright/test';
import { copyright, footerRoot, quickLinksHeading } from './footer.locators';

export async function expectFooterVisible(): Promise<void> {
  await expect(footerRoot()).toBeVisible();
  await expect(copyright()).toBeVisible();
  await expect(quickLinksHeading()).toBeVisible();
}
