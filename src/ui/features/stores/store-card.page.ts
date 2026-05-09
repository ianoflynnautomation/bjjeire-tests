import type { Locator } from '@playwright/test';
import { readText, readTextIfVisible, type CardFieldTestIds } from '@ui/support/ui';

export type StoreCard = Readonly<{
  name: string;
  description: string | null;
}>;

const STORE_CARD_TEST_IDS = {
  description: 'store-card-description',
  name: 'store-card-name',
} as const satisfies CardFieldTestIds<StoreCard>;

export async function readStoreCard(root: Locator): Promise<StoreCard> {
  const [name, description] = await Promise.all([
    readText(root.getByTestId(STORE_CARD_TEST_IDS.name)),
    readTextIfVisible(root.getByTestId(STORE_CARD_TEST_IDS.description)),
  ]);

  return { name, description };
}
