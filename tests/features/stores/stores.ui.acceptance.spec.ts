import { test } from '@ui/fixtures';
import { faker } from '@faker-js/faker';
import { storeCardFromDto } from '@ui/pages/stores/stores.card.mapper';
import { emptyPage } from '@ui/pages/common/empty.page';
import { SEEDED_STORE_ARAN_FIGHT_GEAR, SEEDED_STORE_ARAN_FIGHT_GEAR_PARTIAL_NAME } from '../../testdata/seeded/stores';

const seededStore = SEEDED_STORE_ARAN_FIGHT_GEAR;
const seededStoreCard = storeCardFromDto(seededStore);
const seededStorePartialName = SEEDED_STORE_ARAN_FIGHT_GEAR_PARTIAL_NAME;

test.describe('Stores UI acceptance', { tag: ['@stores', '@ui', '@desktop'] }, () => {
  test(
    'Given available stores, when a visitor opens Stores, then the store list is displayed',
    { tag: ['@smoke', '@acceptance'] },
    async ({ storesPage }) => {
      await storesPage.goTo();
      await storesPage.verifyIsLoaded();
    },
  );

  test(
    'Given no matching store, when a visitor searches, then an empty state is displayed',
    { tag: '@acceptance' },
    async ({ storesPage }) => {
      await storesPage.goTo();
      await storesPage.searchFor(faker.string.alphanumeric({ length: 12 }));
      await storesPage.expectNoResults();
    },
  );

  test(
    'Given a store name, when a visitor searches, then only that store is displayed',
    { tag: '@acceptance' },
    async ({ storesPage }) => {
      await storesPage.goTo();
      await storesPage.searchFor(seededStore.name);
      await storesPage.expectSearchValue(seededStore.name);
      await storesPage.expectCardData(seededStoreCard);
    },
  );

  test(
    'Given part of a store name, when a visitor searches, then the matching store is displayed',
    { tag: '@acceptance' },
    async ({ storesPage }) => {
      await storesPage.goTo();
      await storesPage.searchFor(seededStorePartialName);
      await storesPage.expectSearchValue(seededStorePartialName);
      await storesPage.expectCardData(seededStoreCard);
    },
  );

  test(
    'Given the API returns no stores, when a visitor opens Stores, then the no-data message is shown',
    { tag: '@acceptance' },
    async ({ mockStores, storesPage }) => {
      await mockStores(emptyPage);
      await storesPage.goTo();
      await storesPage.verifyIsLoaded();
      await storesPage.expectEmptyStateMessage();
    },
  );

  test(
    'Given the API request fails, when a visitor opens Stores, then a network error message is shown',
    { tag: '@acceptance' },
    async ({ mockNetworkError, storesPage }) => {
      await mockNetworkError('stores');
      await storesPage.goTo();
      await storesPage.expectNetworkErrorMessage();
    },
  );

  test(
    'Given the API returns a server error, when a visitor opens Stores, then a server error message is shown',
    { tag: '@acceptance' },
    async ({ mockServerError, storesPage }) => {
      await mockServerError('stores');
      await storesPage.goTo();
      await storesPage.expectServerErrorMessage();
    },
  );
});
