// spec: specs/features/shop.md
// seed: tests/agents/seed.spec.ts
import { test, storesTestConfig } from './fixtures';
import { SEEDED_STORE_BURREN_MATS, SEEDED_STORE_FASTNET_GRAPPLING_CO } from './seeded';
import { squash } from '@squash/annotations';

test.use(storesTestConfig);

test.describe('Stores UI acceptance: directory seed cases', { tag: ['@stores', '@ui', '@desktop', '@squash'] }, () => {
  test(
    'visitor should see a store with no description or logo as a card with its name and website link',
    {
      tag: '@acceptance',
      annotation: squash({ weight: 'medium', status: 'work in progress', nature: 'functional', type: 'regression' }),
    },
    async ({ storesPage }) => {
      const { name, websiteUrl } = SEEDED_STORE_BURREN_MATS;

      await test.step('When a visitor opens Shop', async () => {
        await storesPage.goTo();
      });

      await test.step("And the visitor searches for the seeded store's name", async () => {
        await storesPage.searchFor(name);
      });

      await test.step('Then one card is shown, named as the seeded store', async () => {
        await storesPage.expectOnlyCardNamed(name);
      });

      await test.step("And it links to the store's website", async () => {
        await storesPage.expectCardWebsiteLink(name, websiteUrl);
      });

      await test.step('And it shows no description', async () => {
        await storesPage.expectCardWithoutDescription(name);
      });

      await test.step('And it shows the logo fallback in place of a logo image', async () => {
        await storesPage.expectCardLogoFallback(name);
      });
    },
  );

  test(
    'visitor should see no match when searching for an unpublished store by its exact name',
    {
      tag: '@acceptance',
      annotation: squash({ weight: 'medium', status: 'work in progress', nature: 'functional', type: 'regression' }),
    },
    async ({ storesPage }) => {
      await test.step('When a visitor opens Shop', async () => {
        await storesPage.goTo();
      });

      await test.step('And the visitor searches for the published seed store and sees it listed', async () => {
        await storesPage.searchFor(SEEDED_STORE_BURREN_MATS.name);
        await storesPage.expectResultCount(1);
      });

      await test.step("And the visitor searches for the unpublished store's exact name", async () => {
        await storesPage.searchFor(SEEDED_STORE_FASTNET_GRAPPLING_CO.name);
      });

      await test.step('Then the no-match message is shown', async () => {
        await storesPage.expectNoResultsMessage();
      });

      await test.step('And no store is listed', async () => {
        await storesPage.expectResultCount(0);
      });
    },
  );
});
