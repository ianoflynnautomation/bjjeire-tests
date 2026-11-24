// spec: specs/features/shop.md
// seed: tests/agents/seed.spec.ts
import { test, merchTestConfig } from './fixtures';
import { merchSwitchedOnGiven } from './merch-switched-on-ui';
import { SEEDED_RASHGUARD, SEEDED_STORE_ARAN_FIGHT_GEAR } from './seeded';
import { squash } from '@squash/annotations';

test.use(merchTestConfig);

test.describe('Stores UI acceptance: merch', { tag: ['@stores', '@ui', '@desktop', '@merch-on', '@squash'] }, () => {
  const givenSwitchedOn = merchSwitchedOnGiven();

  test(
    'visitor should still see the store directory when the merch cannot be loaded',
    {
      tag: ['@acceptance'],
      annotation: squash({ weight: 'medium', status: 'work in progress', nature: 'functional', type: 'regression' }),
    },
    async ({ storesPage, mockProductsServerError }) => {
      await test.step('Given the merch shop is switched on', () => {
        givenSwitchedOn();
      });

      await test.step('And the merch catalogue answers with a server error', async () => {
        await mockProductsServerError();
      });

      await test.step('When a visitor opens Shop', async () => {
        await storesPage.goToAfterCatalogueAnswers(500);
      });

      await test.step('Then there is no "BJJ Éire merch" section', async () => {
        await storesPage.expectNoMerchSection();
      });

      await test.step('And no error message is shown', async () => {
        await storesPage.expectNoErrorAlert();
      });

      await test.step("And a seeded store's card is listed", async () => {
        await storesPage.expectCardListed(SEEDED_STORE_ARAN_FIGHT_GEAR.name);
      });
    },
  );

  test(
    'visitor should still have their basket after reloading the page',
    {
      tag: ['@acceptance'],
      annotation: squash({ weight: 'medium', status: 'work in progress', nature: 'functional', type: 'regression' }),
    },
    async ({ storesPage, productPage, basketPage }) => {
      await test.step('Given the merch shop is switched on', () => {
        givenSwitchedOn();
      });

      await test.step('And the visitor has added an in-stock size of the seeded rashguard to the basket', async () => {
        await storesPage.goTo();
        await storesPage.openMerchProduct(SEEDED_RASHGUARD.name);
        await productPage.chooseSize(SEEDED_RASHGUARD.inStockSize);
        await productPage.addToBasket();
      });

      await test.step('When the visitor reloads the page', async () => {
        await productPage.reload();
      });

      await test.step('And opens the basket', async () => {
        await basketPage.openFromNavigation();
      });

      await test.step('Then the basket lists the rashguard in that size with a quantity of 1', async () => {
        await basketPage.expectSingleLine(SEEDED_RASHGUARD.name, SEEDED_RASHGUARD.inStockSize, 1);
      });

      await test.step('And the basket icon in the navigation shows 1 item', async () => {
        await basketPage.expectNavigationCount(1);
      });
    },
  );

  test(
    'visitor should see an empty basket with a way back to Shop when nothing has been added',
    {
      tag: ['@acceptance'],
      annotation: squash({ weight: 'medium', status: 'work in progress', nature: 'functional', type: 'regression' }),
    },
    async ({ basketPage }) => {
      await test.step('Given the merch shop is switched on', () => {
        givenSwitchedOn();
      });

      await test.step('When a visitor with an empty basket opens the basket address', async () => {
        await basketPage.goTo();
      });

      await test.step('Then the page says the basket is empty', async () => {
        await basketPage.expectEmptyBasket();
      });

      await test.step('And it offers a link back to Shop, which leads to `/shop`', async () => {
        await basketPage.expectLinkBackToShop();
      });

      await test.step('And no checkout control is offered', async () => {
        await basketPage.expectNoCheckoutControl();
      });
    },
  );

  test.describe('with a signed-out visitor', () => {
    // True by construction: no stored sign-in, so the browser holds no organiser account whatever the environment.
    test.use({ storageState: { cookies: [], origins: [] } });

    test(
      'visitor should see the organiser sign-in when opening the shop admin without signing in',
      {
        tag: ['@acceptance', '@local-sign-in'],
        annotation: squash({ weight: 'medium', status: 'work in progress', nature: 'security', type: 'regression' }),
      },
      async ({ shopAdminPage }) => {
        await test.step('Given the merch shop is switched on', () => {
          givenSwitchedOn();
        });

        await test.step('When a signed-out visitor opens the shop admin', async () => {
          await shopAdminPage.goTo();
        });

        await test.step('Then the organiser sign-in is shown', async () => {
          await shopAdminPage.expectSignInPrompt();
        });

        await test.step('And no product is listed', async () => {
          await shopAdminPage.expectNoProductListed();
        });

        await test.step('And no product management control is shown', async () => {
          await shopAdminPage.expectNoManagementControls();
        });
      },
    );
  });
});
