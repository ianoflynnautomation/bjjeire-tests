import { type Locator, type Page } from '@playwright/test';
import { ListPage } from '../common/list-page';
import { getStoreCardData } from './stores.card.page';
import { NO_DATA_COPY, TEST_IDS } from './stores.constants';
import type { StoreCard } from './stores.types';

export class StoresPage extends ListPage<StoreCard> {
  constructor(page: Page) {
    super(page, { route: '/stores', testIds: TEST_IDS, noDataCopy: NO_DATA_COPY });
  }

  protected readCardData(card: Locator): Promise<StoreCard> {
    return getStoreCardData(card);
  }
}
