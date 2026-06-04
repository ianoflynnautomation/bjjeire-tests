import { test } from '@ui/fixtures';
import * as StoresPage from '@ui/pages/stores/stores.page';
import { SEEDED_STORE_BJJ_CORK, SEEDED_STORE_BJJ_CORK_PARTIAL } from '../../testdata/stores';

test.describe('Stores UI Acceptance', { tag: ['@stores', '@ui', '@desktop'] }, () => {
  test('loads the stores list', { tag: ['@smoke'] }, async () => {
    await StoresPage.navigate();
    await StoresPage.verifyIsLoaded();
  });

  test('search with no match shows the empty state', { tag: '@acceptance' }, async () => {
    await StoresPage.navigate();
    await StoresPage.searchFor('xyz');
    await StoresPage.expectNoResults();
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
