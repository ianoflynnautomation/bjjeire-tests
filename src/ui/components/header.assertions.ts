import { expect } from '@playwright/test';
import { logoLink, navigation } from './header.locators';

export async function expectHeaderVisible(): Promise<void> {
  await expect(navigation()).toBeVisible();
  await expect(logoLink()).toBeVisible();
}
