import { test, storesTestConfig } from './fixtures';
import { faker } from '@faker-js/faker';
import { storeCardFromDto } from '@ui/pages/stores/stores.card.mapper';
import { emptyPage } from '../common/testdata/mocks/empty-page';
import { SEEDED_STORE_ARAN_FIGHT_GEAR, SEEDED_STORE_ARAN_FIGHT_GEAR_PARTIAL_NAME } from './seeded';
import { squash } from '@squash/annotations';

test.use(storesTestConfig);

const seededStore = SEEDED_STORE_ARAN_FIGHT_GEAR;
const seededStoreCard = storeCardFromDto(seededStore);
const seededStorePartialName = SEEDED_STORE_ARAN_FIGHT_GEAR_PARTIAL_NAME;

test.describe('Stores UI acceptance', { tag: ['@stores', '@ui', '@desktop', '@squash'] }, () => {
  test(
    'visitor should see the store list when opening Stores',
    {
      tag: ['@smoke', '@acceptance'],
      annotation: squash({ weight: 'high', status: 'approved', nature: 'functional', type: 'regression' }),
    },
    async ({ storesPage }) => {
      await storesPage.goTo();
      await storesPage.verifyIsLoaded();
    },
  );

  test(
    'visitor should see an empty state when no store matches the search',
    {
      tag: '@acceptance',
      annotation: squash({ weight: 'medium', status: 'approved', nature: 'functional', type: 'regression' }),
    },
    async ({ storesPage }) => {
      await storesPage.goTo();
      await storesPage.searchFor(faker.string.alphanumeric({ length: 12 }));
      await storesPage.expectNoResults();
    },
  );

  test(
    'visitor should find only the store searched for by name',
    {
      tag: '@acceptance',
      annotation: squash({ weight: 'medium', status: 'approved', nature: 'functional', type: 'regression' }),
    },
    async ({ storesPage }) => {
      await storesPage.goTo();
      await storesPage.searchFor(seededStore.name);
      await storesPage.expectResultCount(1);
      await storesPage.expectCardData(seededStoreCard);
    },
  );

  test(
    'visitor should find a store by part of its name',
    {
      tag: '@acceptance',
      annotation: squash({ weight: 'medium', status: 'approved', nature: 'functional', type: 'regression' }),
    },
    async ({ storesPage }) => {
      await storesPage.goTo();
      await storesPage.searchFor(seededStorePartialName);
      await storesPage.expectResultCount(1);
      await storesPage.expectCardData(seededStoreCard);
    },
  );

  test(
    'visitor should see the no-data message when the API returns no stores',
    {
      tag: '@acceptance',
      annotation: squash({ weight: 'medium', status: 'approved', nature: 'functional', type: 'regression' }),
    },
    async ({ mockStores, storesPage }) => {
      await mockStores(emptyPage);
      await storesPage.goTo();
      await storesPage.verifyIsLoaded();
      await storesPage.expectEmptyStateMessage();
    },
  );

  test(
    'visitor should see a network error message when the stores request fails',
    {
      tag: '@acceptance',
      annotation: squash({ weight: 'medium', status: 'approved', nature: 'functional', type: 'regression' }),
    },
    async ({ mockNetworkError, storesPage }) => {
      await mockNetworkError();
      await storesPage.goTo();
      await storesPage.expectNetworkErrorMessage();
    },
  );

  test(
    'visitor should see a server error message when the stores API returns a server error',
    {
      tag: '@acceptance',
      annotation: squash({ weight: 'medium', status: 'approved', nature: 'functional', type: 'regression' }),
    },
    async ({ mockServerError, storesPage }) => {
      await mockServerError();
      await storesPage.goTo();
      await storesPage.expectServerErrorMessage();
    },
  );
});
