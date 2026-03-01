import { type Page } from '@playwright/test';
import { type NavigationOptions } from '../types/playwright-types';
import { waitForPageLoadState } from './action-utils';

export async function saveStorageState(page: Page, path?: string): Promise<void> {
  await page.context().storageState({ path });
}

export async function getURL(page: Page, options: NavigationOptions = { waitUntil: 'load' }): Promise<string> {
  try {
    await waitForPageLoadState(page, options);
    return page.url();
  } catch (error) {
    console.log(`getURL- ${error instanceof Error ? error.message : String(error)}`);
    return '';
  }
}
