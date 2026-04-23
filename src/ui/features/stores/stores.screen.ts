import type { Page } from '@playwright/test';
import { createListScreen, listScreenTestIds, type ListScreen } from '@ui/support/ui';
import { readStoreCard, type StoreCard } from './store-card.screen';

export type StoresScreen = ListScreen<StoreCard>;

export function createStoresScreen(page: Page): StoresScreen {
  return createListScreen<StoreCard>(page, {
    route: '/stores',
    testIds: listScreenTestIds('stores', 'store'),
    readCard: readStoreCard,
  });
}
