// spec: specs/features/shop.md
// seed: tests/agents/seed.spec.ts
import { test, storesTestConfig } from './fixtures';
import { faker } from '@faker-js/faker';
import { API_ROUTES, DEFAULT_PAGE_SIZE } from '@api/support';
import { paginatePages } from '@ui/mocks/paginate.mock';
import { storeCardFromDto } from '@ui/pages/stores/stores.card.mapper';
import { expectAddress, expectNoSidewaysScroll, goBackToPreviousPage, gotoAppShell } from '@ui/support';
import { emptyPage } from '../common/testdata/mocks/empty-page';
import { SEEDED_STORE_ARAN_FIGHT_GEAR, SEEDED_STORE_ARAN_FIGHT_GEAR_PARTIAL_NAME } from './seeded';
import { SHOP_NAV } from '@ui/pages/stores/stores.constants';
import { squash } from '@squash/annotations';

test.use(storesTestConfig);

const seededStore = SEEDED_STORE_ARAN_FIGHT_GEAR;
const seededStoreCard = storeCardFromDto(seededStore);
const seededStorePartialName = SEEDED_STORE_ARAN_FIGHT_GEAR_PARTIAL_NAME;
const LONG_LINK = `https://www.example.ie/${'a'.repeat(100)}`;
const pageWithLongDescription = paginatePages(
  [{ ...seededStore, description: LONG_LINK }],
  DEFAULT_PAGE_SIZE,
  API_ROUTES.stores,
)[1];
const OLD_STORES_LINKS = [
  { label: 'to the directory', address: '/stores' },
  { label: 'to a page under it', address: '/stores/some-old-page' },
];
const descriptionOnlyWord = 'fixture';

test.describe('Stores UI acceptance', { tag: ['@stores', '@ui', '@desktop', '@squash'] }, () => {
  test(
    'visitor should see the store list when opening Shop',
    {
      tag: ['@smoke', '@acceptance'],
      annotation: squash({ weight: 'high', status: 'approved', nature: 'functional', type: 'regression' }),
    },
    async ({ storesPage }) => {
      await test.step('When a visitor opens Shop', async () => {
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
      await test.step('When a visitor opens Shop', async () => {
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
      await test.step('When a visitor opens Shop', async () => {
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
    'visitor should find a store when searching in a different letter case',
    {
      tag: '@acceptance',
      annotation: squash({ weight: 'medium', status: 'work in progress', nature: 'functional', type: 'regression' }),
    },
    async ({ storesPage }) => {
      await test.step('When a visitor opens Shop', async () => {
        await storesPage.goTo();
      });

      await test.step("And the visitor searches for the seeded store's name in upper case", async () => {
        await storesPage.searchFor(seededStore.name.toUpperCase());
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
      await test.step('When a visitor opens Shop', async () => {
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
    'visitor should not find a store by a word only in its description',
    {
      tag: '@acceptance',
      annotation: squash({ weight: 'medium', status: 'work in progress', nature: 'functional', type: 'regression' }),
    },
    async ({ storesPage }) => {
      await test.step('When a visitor opens Shop', async () => {
        await storesPage.goTo();
      });

      await test.step(`And the visitor searches for "${descriptionOnlyWord}", a word only in store descriptions`, async () => {
        await storesPage.searchFor(descriptionOnlyWord);
      });

      await test.step('Then no stores are listed', async () => {
        await storesPage.expectNoResults();
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

      await test.step('When a visitor opens Shop', async () => {
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

      await test.step('When a visitor opens Shop', async () => {
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

      await test.step('When a visitor opens Shop', async () => {
        await storesPage.goTo();
      });

      await test.step('Then a server error message is displayed', async () => {
        await storesPage.expectServerErrorMessage();
      });
    },
  );

  test(
    'visitor should see Shop in the navigation instead of Stores',
    {
      tag: '@acceptance',
      annotation: squash({ weight: 'medium', status: 'work in progress', nature: 'functional', type: 'regression' }),
    },
    async ({ page, headerSection, footerSection }) => {
      await test.step('When a visitor opens the home page', async () => {
        await gotoAppShell(page, '/');
      });

      await test.step('Then the header offers a Shop link to `/shop`', async () => {
        await headerSection.expectPageLink(SHOP_NAV.name, SHOP_NAV.path);
      });

      await test.step('And the header offers no Stores link', async () => {
        await headerSection.expectNoPageLink(SHOP_NAV.retiredName);
      });

      await test.step('And the footer quick links offer a Shop link to `/shop`', async () => {
        await footerSection.expectQuickLink(SHOP_NAV.name, SHOP_NAV.path);
      });
    },
  );

  test(
    'visitor should land on the Shop page when choosing Shop in the navigation',
    {
      tag: '@acceptance',
      annotation: squash({ weight: 'medium', status: 'work in progress', nature: 'functional', type: 'regression' }),
    },
    async ({ page, headerSection, storesPage }) => {
      await test.step('When a visitor opens the home page', async () => {
        await gotoAppShell(page, '/');
      });

      await test.step('And the visitor chooses Shop in the header', async () => {
        await headerSection.openPage(SHOP_NAV.name);
      });

      await test.step('Then the address is `/shop`', async () => {
        await storesPage.expectOnShopPage();
      });

      await test.step('And the main heading is "Shop"', async () => {
        await storesPage.expectTitle(SHOP_NAV.name);
      });

      await test.step('And the tab title is "Shop | BJJ Éire"', async () => {
        await storesPage.expectTabTitle(`${SHOP_NAV.name} | BJJ Éire`);
      });

      await test.step("And a seeded store's card is listed", async () => {
        await storesPage.expectCardData(seededStoreCard);
      });
    },
  );

  for (const { label, address } of OLD_STORES_LINKS) {
    test(
      `visitor should land on the Shop page when following an old Stores link ${label}`,
      {
        tag: '@acceptance',
        annotation: squash({ weight: 'medium', status: 'work in progress', nature: 'functional', type: 'regression' }),
      },
      async ({ storesPage }) => {
        await test.step(`When a visitor opens ${address}`, async () => {
          await storesPage.goToOldAddress(address);
        });

        await test.step('Then the address is `/shop`', async () => {
          await storesPage.expectOnShopPage();
        });

        await test.step('And the main heading is "Shop"', async () => {
          await storesPage.expectTitle(SHOP_NAV.name);
        });

        await test.step("And a seeded store's card is listed", async () => {
          await storesPage.expectCardData(seededStoreCard);
        });
      },
    );
  }

  test(
    'visitor should return to the page before the old Stores link when going back',
    {
      tag: '@acceptance',
      annotation: squash({ weight: 'medium', status: 'work in progress', nature: 'functional', type: 'regression' }),
    },
    async ({ page, storesPage }) => {
      await test.step('When a visitor opens Gyms', async () => {
        await gotoAppShell(page, '/gyms');
      });

      await test.step('And the visitor opens `/stores`', async () => {
        await storesPage.goToOldAddress('/stores');
      });

      await test.step('And the visitor goes back', async () => {
        await goBackToPreviousPage(page);
      });

      await test.step('Then the address is `/gyms`', async () => {
        await expectAddress(page, '/gyms');
      });
    },
  );

  test(
    'visitor should see the search applied when opening a Shop link that carries a search term',
    {
      tag: '@acceptance',
      annotation: squash({ weight: 'medium', status: 'work in progress', nature: 'functional', type: 'regression' }),
    },
    async ({ storesPage }) => {
      await test.step("When a visitor opens a Shop link that already searches for the seeded store's name", async () => {
        await storesPage.goToWithQuery(`q=${encodeURIComponent(seededStore.name)}`);
      });

      await test.step('Then the search box holds that name', async () => {
        await storesPage.expectSearchValue(seededStore.name);
      });

      await test.step('And only that store is listed', async () => {
        await storesPage.expectResultCount(1);
        await storesPage.expectCardData(seededStoreCard);
      });
    },
  );
});

test.describe('Stores UI acceptance: clearing the search', { tag: ['@stores', '@ui', '@desktop', '@squash'] }, () => {
  test(
    'visitor should see the full list again when clearing the search',
    {
      tag: '@acceptance',
      annotation: squash({ weight: 'medium', status: 'work in progress', nature: 'functional', type: 'regression' }),
    },
    async ({ storesPage }) => {
      await test.step('When a visitor opens Shop', async () => {
        await storesPage.goTo();
      });

      await test.step("And the visitor searches for the seeded store's name", async () => {
        await storesPage.searchFor(seededStore.name);
      });

      await test.step('And only that store is listed', async () => {
        await storesPage.expectResultCount(1);
      });

      await test.step('And the visitor clears the search', async () => {
        await storesPage.clearSearchWithButton();
      });

      await test.step('Then the search box is empty', async () => {
        await storesPage.expectSearchValue('');
      });

      await test.step('And more than one store is listed', async () => {
        await storesPage.expectMoreThanOneResult();
      });

      await test.step('And the address carries no search term', async () => {
        await storesPage.expectNoSearchTermInAddress();
      });
    },
  );
});

test.describe('Stores UI acceptance: on a phone', { tag: ['@stores', '@ui', '@desktop', '@squash'] }, () => {
  test.use({ viewport: { width: 360, height: 740 } });

  test(
    'visitor should see a long unbroken description stay inside its card on a phone',
    {
      tag: '@acceptance',
      annotation: squash({ weight: 'low', status: 'work in progress', nature: 'non functional', type: 'regression' }),
    },
    async ({ mockStores, storesPage, page }) => {
      await test.step('Given a store whose description contains a very long link', async () => {
        await mockStores(pageWithLongDescription);
      });

      await test.step('When a visitor opens Shop', async () => {
        await storesPage.goTo();
        await storesPage.expectResultCount(1);
      });

      await test.step('Then the page fits the screen', async () => {
        await expectNoSidewaysScroll(page);
      });
    },
  );
});

test.describe('Stores UI acceptance: store list on a phone', { tag: ['@stores', '@ui', '@mobile', '@squash'] }, () => {
  test(
    'visitor should see the store list on a phone',
    {
      tag: '@acceptance',
      annotation: squash({ weight: 'medium', status: 'work in progress', nature: 'functional', type: 'regression' }),
    },
    async ({ storesPage, page }) => {
      await test.step('When a visitor opens Shop on a phone', async () => {
        await storesPage.goTo();
      });

      await test.step("And the visitor searches for the seeded store's name", async () => {
        await storesPage.searchFor(seededStore.name);
      });

      await test.step('Then the store list is displayed', async () => {
        await storesPage.expectListNotEmpty();
      });

      await test.step('And only that store is listed', async () => {
        await storesPage.expectResultCount(1);
      });

      await test.step("And the seeded store's card shows its name, description and website link", async () => {
        await storesPage.expectCardData(seededStoreCard);
      });

      await test.step('And the page fits the screen', async () => {
        await expectNoSidewaysScroll(page);
      });
    },
  );
});
