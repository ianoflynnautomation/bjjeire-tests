import {
  expectPageToHaveURL,
  expectVisible,
  getLocatorByRole,
  getLocatorByTestId,
  getPage,
  goToPage,
} from '@ui/support';
import { TEST_IDS } from './about.constants';

const main = () => getLocatorByRole(TEST_IDS.main);
const headerTitle = () => getLocatorByTestId(TEST_IDS.headerTitle);
const missionSection = () => getLocatorByTestId(TEST_IDS.missionSection);
const valuesSection = () => getLocatorByTestId(TEST_IDS.valuesSection);
const contactSection = () => getLocatorByTestId(TEST_IDS.contactSection);

export async function navigate(): Promise<void> {
  await goToPage(getPage(), '/about');
}

export async function verifyIsLoaded(): Promise<void> {
  await expectPageToHaveURL(/\/about$/);
  await expectVisible(main());
  await expectVisible(headerTitle());
  await expectVisible(missionSection());
  await expectVisible(valuesSection());
  await expectVisible(contactSection());
}
