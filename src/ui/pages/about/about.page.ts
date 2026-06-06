import type { Page } from '@playwright/test';
import { expectPageToHaveURL, expectVisible, getLocatorByRole, getLocatorByTestId, goToPage } from '@ui/support';
import { TEST_IDS } from './about.constants';

const main = (page: Page) => getLocatorByRole(page, TEST_IDS.main);
const headerTitle = (page: Page) => getLocatorByTestId(page, TEST_IDS.headerTitle);
const missionSection = (page: Page) => getLocatorByTestId(page, TEST_IDS.missionSection);
const valuesSection = (page: Page) => getLocatorByTestId(page, TEST_IDS.valuesSection);
const contactSection = (page: Page) => getLocatorByTestId(page, TEST_IDS.contactSection);

export async function navigate(page: Page): Promise<void> {
  await goToPage(page, '/about');
}

export async function verifyIsLoaded(page: Page): Promise<void> {
  await expectPageToHaveURL(page, /\/about$/);
  await expectVisible(main(page));
  await expectVisible(headerTitle(page));
  await expectVisible(missionSection(page));
  await expectVisible(valuesSection(page));
  await expectVisible(contactSection(page));
}
