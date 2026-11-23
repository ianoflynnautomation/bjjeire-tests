// spec: specs/features/shop.md
// seed: tests/agents/seed.spec.ts
import { test, merchTestConfig } from './fixtures';
import { merchSwitchedOnGiven } from './merch-switched-on-ui';
import { SEEDED_RASHGUARD } from './seeded';
import { expectNoSidewaysScroll } from '@ui/support';
import { squash } from '@squash/annotations';

test.use(merchTestConfig);

test.describe(
  'Stores UI acceptance: merch on a phone',
  { tag: ['@stores', '@ui', '@mobile', '@merch-on', '@squash'] },
  () => {
    const givenSwitchedOn = merchSwitchedOnGiven();
    const annotation = squash({
      weight: 'medium',
      status: 'work in progress',
      nature: 'non functional',
      type: 'regression',
    });

    test(
      'visitor should see the merch section fit a phone',
      { tag: ['@acceptance'], annotation },
      async ({ storesPage, page }) => {
        await test.step('Given the merch shop is switched on', () => {
          givenSwitchedOn();
        });

        await test.step('When a visitor opens Shop on a phone', async () => {
          await storesPage.goTo();
        });

        await test.step("Then the seeded rashguard's card is shown with its photo, name and price", async () => {
          await storesPage.expectMerchCard(SEEDED_RASHGUARD.name, SEEDED_RASHGUARD.displayPrice);
        });

        await test.step('And the page does not scroll sideways', async () => {
          await expectNoSidewaysScroll(page);
        });
      },
    );

    test(
      'visitor should see a product page fit a phone',
      { tag: ['@acceptance'], annotation },
      async ({ storesPage, productPage, page }) => {
        await test.step('Given the merch shop is switched on', () => {
          givenSwitchedOn();
        });

        await test.step('When a visitor opens Shop on a phone', async () => {
          await storesPage.goTo();
        });

        await test.step('And the visitor opens the seeded rashguard', async () => {
          await storesPage.openMerchProduct(SEEDED_RASHGUARD.name);
        });

        await test.step('Then the product page shows its sizes and its photo', async () => {
          await productPage.expectSizesAndPhoto(SEEDED_RASHGUARD.sizes);
        });

        await test.step('And the page does not scroll sideways', async () => {
          await expectNoSidewaysScroll(page);
        });
      },
    );
  },
);
