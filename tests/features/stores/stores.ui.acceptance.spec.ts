import { test } from '@ui/fixtures';
import { EXPECTED_STORE_WOLFHOUND_CARD, EXPECTED_STORE_WOLFHOUND_PARTIAL } from '../../testdata/stores';
import { faker } from '@faker-js/faker';
import storesFixture from '../../testdata/mocks/stores.page-1.json';

test.describe('Stores UI acceptance', { tag: ['@stores', '@ui', '@desktop'] }, () => {
  test.beforeEach(async ({ mockStores }) => {
    await mockStores(storesFixture);
  });

  test(
    'Given available stores, when a visitor opens Stores, then the store list is displayed',
    { tag: ['@smoke'] },
    async ({ storesPage }) => {
      await storesPage.navigate();
      await storesPage.verifyIsLoaded();
    },
  );

  test(
    'Given no matching store, when a visitor searches, then an empty state is displayed',
    { tag: '@acceptance' },
    async ({ storesPage }) => {
      await storesPage.navigate();
      await storesPage.searchFor(faker.string.alphanumeric({ length: 12 }));
      await storesPage.expectNoResults();
    },
  );

  test(
    'Given a store name, when a visitor searches, then only that store is displayed',
    { tag: '@acceptance' },
    async ({ storesPage }) => {
      await storesPage.navigate();
      await storesPage.searchFor(EXPECTED_STORE_WOLFHOUND_CARD.name);
      await storesPage.expectSearchValue(EXPECTED_STORE_WOLFHOUND_CARD.name);
      await storesPage.expectCardData(EXPECTED_STORE_WOLFHOUND_CARD.name, EXPECTED_STORE_WOLFHOUND_CARD);
    },
  );

  test(
    'Given part of a store name, when a visitor searches, then the matching store is displayed',
    { tag: '@acceptance' },
    async ({ storesPage }) => {
      await storesPage.navigate();
      await storesPage.searchFor(EXPECTED_STORE_WOLFHOUND_PARTIAL);
      await storesPage.expectSearchValue(EXPECTED_STORE_WOLFHOUND_PARTIAL);
      await storesPage.expectCardData(EXPECTED_STORE_WOLFHOUND_CARD.name, EXPECTED_STORE_WOLFHOUND_CARD);
    },
  );
});
