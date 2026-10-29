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
      await test.step('When a visitor opens Stores', async () => {
        await storesPage.goTo();
      });

      await test.step('Then the store list is displayed', async () => {
        await storesPage.verifyIsLoaded();
      });
    },
  );

  test(
    'visitor should see an empty state when no store matches the search',
    {
      tag: '@acceptance',
      annotation: squash({ weight: 'medium', status: 'approved', nature: 'functional', type: 'regression' }),
    },
    async ({ storesPage }) => {
      await test.step('When a visitor opens Stores', async () => {
        await storesPage.goTo();
      });

      await test.step('And the visitor searches for a name that matches nothing', async () => {
        await storesPage.searchFor(faker.string.alphanumeric({ length: 12 }));
      });

      await test.step('Then no stores are listed', async () => {
        await storesPage.expectNoResults();
      });
    },
  );

  test(
    'visitor should find only the store searched for by name',
    {
      tag: '@acceptance',
      annotation: squash({ weight: 'medium', status: 'approved', nature: 'functional', type: 'regression' }),
    },
    async ({ storesPage }) => {
      await test.step('When a visitor opens Stores', async () => {
        await storesPage.goTo();
      });

      await test.step(`And the visitor searches for "${seededStore.name}"`, async () => {
        await storesPage.searchFor(seededStore.name);
      });

      await test.step('Then only that store is listed', async () => {
        await storesPage.expectResultCount(1);
        await storesPage.expectCardData(seededStoreCard);
      });
    },
  );

  test(
    'visitor should find a store by part of its name',
    {
      tag: '@acceptance',
      annotation: squash({ weight: 'medium', status: 'approved', nature: 'functional', type: 'regression' }),
    },
    async ({ storesPage }) => {
      await test.step('When a visitor opens Stores', async () => {
        await storesPage.goTo();
      });

      await test.step(`And the visitor searches for "${seededStorePartialName}"`, async () => {
        await storesPage.searchFor(seededStorePartialName);
      });

      await test.step('Then the store matching that part of the name is listed', async () => {
        await storesPage.expectResultCount(1);
        await storesPage.expectCardData(seededStoreCard);
      });
    },
  );

  test(
    'visitor should see the no-data message when there are no stores to show',
    {
      tag: '@acceptance',
      annotation: squash({ weight: 'medium', status: 'approved', nature: 'functional', type: 'regression' }),
    },
    async ({ mockStores, storesPage }) => {
      await test.step('Given there are no stores to show', async () => {
        await mockStores(emptyPage);
      });

      await test.step('When a visitor opens Stores', async () => {
        await storesPage.goTo();
      });

      await test.step('Then the no-data message is displayed', async () => {
        await storesPage.verifyIsLoaded();
        await storesPage.expectEmptyStateMessage();
      });
    },
  );

  test(
    'visitor should see a network error message when stores cannot be loaded because the connection fails',
    {
      tag: '@acceptance',
      annotation: squash({ weight: 'medium', status: 'approved', nature: 'functional', type: 'regression' }),
    },
    async ({ mockNetworkError, storesPage }) => {
      await test.step("Given the visitor's connection fails while stores load", async () => {
        await mockNetworkError();
      });

      await test.step('When a visitor opens Stores', async () => {
        await storesPage.goTo();
      });

      await test.step('Then a network error message is displayed', async () => {
        await storesPage.expectNetworkErrorMessage();
      });
    },
  );

  test(
    'visitor should see a server error message when stores cannot be loaded because of a server problem',
    {
      tag: '@acceptance',
      annotation: squash({ weight: 'medium', status: 'approved', nature: 'functional', type: 'regression' }),
    },
    async ({ mockServerError, storesPage }) => {
      await test.step('Given the store service is unavailable', async () => {
        await mockServerError();
      });

      await test.step('When a visitor opens Stores', async () => {
        await storesPage.goTo();
      });

      await test.step('Then a server error message is displayed', async () => {
        await storesPage.expectServerErrorMessage();
      });
    },
  );
});
