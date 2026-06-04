import { expectVisible, getLocatorByRole, getPage, goToPage } from '@ui/support';

const main = () => getLocatorByRole('main');

export async function navigate(): Promise<void> {
  await goToPage(getPage(), '/template');
}

export async function verifyIsLoaded(): Promise<void> {
  await expectVisible(main());
}
