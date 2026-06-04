import type { Locator } from '@playwright/test';
import { getText, readTextIfVisible } from '@ui/support';
import { type StoreCard } from './stores.types';
import { TEST_IDS } from './stores.constants';

export async function getStoreCardData(root: Locator): Promise<StoreCard> {
  const [name, description] = await Promise.all([
    getText(root.getByTestId(TEST_IDS.cardName)),
    readTextIfVisible(root.getByTestId(TEST_IDS.description)),
  ]);

  return { name, description };
}
export { StoreCard };
