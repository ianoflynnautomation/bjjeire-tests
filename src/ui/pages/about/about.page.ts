import { expect, type Page } from '@playwright/test';
import { TEST_IDS } from './about.constants';

const main = (page: Page) => page.getByRole(TEST_IDS.main);
const headerTitle = (page: Page) => page.getByTestId(TEST_IDS.headerTitle);
const missionSection = (page: Page) => page.getByTestId(TEST_IDS.missionSection);
const valuesSection = (page: Page) => page.getByTestId(TEST_IDS.valuesSection);
const contactSection = (page: Page) => page.getByTestId(TEST_IDS.contactSection);

export async function navigate(page: Page): Promise<void> {
  await page.goto('/about');
}

export async function verifyIsLoaded(page: Page): Promise<void> {
  await expect(page).toHaveURL(/\/about$/);
  await expect(main(page)).toBeVisible();
  await expect(headerTitle(page)).toBeVisible();
  await expect(missionSection(page)).toBeVisible();
  await expect(valuesSection(page)).toBeVisible();
  await expect(contactSection(page)).toBeVisible();
}
