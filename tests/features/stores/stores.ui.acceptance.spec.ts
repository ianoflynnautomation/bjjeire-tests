import { test } from '@ui/fixtures';
import { SEEDED_STORE_BJJ_CORK, SEEDED_STORE_BJJ_CORK_PARTIAL } from '../../testdata/stores';

test.describe('Stores UI Acceptance', { tag: ['@stores', '@ui', '@desktop'] }, () => {
  test('loads the stores list', { tag: ['@smoke'] }, async ({ storesPage }) => {
    await storesPage.navigate();
    await storesPage.verifyIsLoaded();
  });

  test('search with no match shows the empty state', { tag: '@acceptance' }, async ({ storesPage }) => {
    await storesPage.navigate();
    await storesPage.searchFor('xyz');
    await storesPage.expectNoResults();
  });

  test('search by store name shows that store only', { tag: '@acceptance' }, async ({ storesPage }) => {
    await storesPage.navigate();
    await storesPage.searchFor(SEEDED_STORE_BJJ_CORK.name);
    await storesPage.expectSearchValue(SEEDED_STORE_BJJ_CORK.name);
    await storesPage.expectCardData(SEEDED_STORE_BJJ_CORK.name, SEEDED_STORE_BJJ_CORK);
  });

  test('search by partial store name shows that store only', { tag: '@acceptance' }, async ({ storesPage }) => {
    await storesPage.navigate();
    await storesPage.searchFor(SEEDED_STORE_BJJ_CORK_PARTIAL);
    await storesPage.expectSearchValue(SEEDED_STORE_BJJ_CORK_PARTIAL);
    await storesPage.expectCardData(SEEDED_STORE_BJJ_CORK.name, SEEDED_STORE_BJJ_CORK);
  });
});
