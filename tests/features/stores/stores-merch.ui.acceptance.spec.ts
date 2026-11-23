// spec: specs/features/shop.md
// seed: tests/agents/seed.spec.ts
import { test, merchTestConfig } from './fixtures';
import { merchSwitchedOnGiven } from './merch-switched-on-ui';
import { SEEDED_STORE_ARAN_FIGHT_GEAR } from './seeded';
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
