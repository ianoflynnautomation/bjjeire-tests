import { test } from '@ui/features/stores/stores.fixture';
import * as StoresPage from '@ui/features/stores/stores.page';
import { SEEDED_STORE_BJJ_CORK, SEEDED_STORE_BJJ_CORK_PARTIAL } from '../../testdata/stores';
import { NO_MATCH_SEARCH_TERM } from '../../testdata/strings';

test.describe('Stores UI Acceptance', { tag: ['@stores', '@ui', '@desktop'] }, () => {
  test('loads the stores list', { tag: ['@smoke', '@acceptance', '@mobile'] }, async () => {
    await StoresPage.navigate();
    await StoresPage.verifyIsLoaded();
    await StoresPage.expectHeaderVisible();
  });

  test('search with no match shows the empty state', { tag: '@acceptance' }, async () => {
    await StoresPage.navigate();
    await StoresPage.searchFor(NO_MATCH_SEARCH_TERM);
    await StoresPage.expectNoResults();
    await StoresPage.clearSearch();
    await StoresPage.expectAtLeastOneResult();
  });

  test('search by store name shows that store only', { tag: '@acceptance' }, async () => {
    await StoresPage.navigate();
    await StoresPage.searchFor(SEEDED_STORE_BJJ_CORK.name);
    await StoresPage.expectSearchValue(SEEDED_STORE_BJJ_CORK.name);
    await StoresPage.expectCardData(SEEDED_STORE_BJJ_CORK.name, SEEDED_STORE_BJJ_CORK);
  });

  test('search by partial store name shows that store only', { tag: '@acceptance' }, async () => {
    await StoresPage.navigate();
    await StoresPage.searchFor(SEEDED_STORE_BJJ_CORK_PARTIAL);
    await StoresPage.expectSearchValue(SEEDED_STORE_BJJ_CORK_PARTIAL);
    await StoresPage.expectCardData(SEEDED_STORE_BJJ_CORK.name, SEEDED_STORE_BJJ_CORK);
  });
});
