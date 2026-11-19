import type { Locator } from '@playwright/test';
import { getAttributeIfPresent, getText, getTextIfPresent } from '@ui/support';
import { type StoreCard } from './stores.types';
import { TEST_IDS, websiteLinkName } from './stores.constants';

export async function getStoreCardData(root: Locator): Promise<StoreCard> {
  const name = await getText(root.getByTestId(TEST_IDS.cardName));
  const [description, websiteUrl] = await Promise.all([
    getTextIfPresent(root.getByTestId(TEST_IDS.description)),
    getAttributeIfPresent(root.getByRole('link', { name: websiteLinkName(name) }), 'href'),
  ]);

  return { name, description, websiteUrl };
}
