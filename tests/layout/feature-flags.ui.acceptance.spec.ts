// spec: specs/features/layout.md
// seed: tests/agents/seed.spec.ts
import { test, expect } from '@ui/fixtures';
import { ALL_FEATURES_ENABLED } from '@ui/fixtures/feature-flags.fixture';
import { gotoAppShell } from '@ui/support';
import { squash } from '@squash/annotations';

test.use({ featureFlagOverrides: { ...ALL_FEATURES_ENABLED, Stores: false } });

test.describe('Disabled feature UI acceptance', { tag: ['@layout', '@routing', '@ui', '@desktop', '@squash'] }, () => {
  test(
    'visitor should land on an enabled feature when opening the disabled stores page',
    {
      tag: '@acceptance',
      annotation: squash({ weight: 'medium', status: 'approved', nature: 'functional', type: 'regression' }),
    },
    async ({ page }) => {
      await test.step('When a visitor opens the stores page while stores are disabled', async () => {
        await gotoAppShell(page, '/shop');
      });

      await test.step('Then the visitor lands on Events', async () => {
        await expect(page).toHaveURL(/\/events$/);
      });
    },
  );

  test(
    'visitor should not be offered stores in the header when the feature is disabled',
    {
      tag: '@acceptance',
      annotation: squash({ weight: 'medium', status: 'approved', nature: 'functional', type: 'regression' }),
    },
    async ({ page, headerSection }) => {
      await test.step('When a visitor opens the home page while stores are disabled', async () => {
        await gotoAppShell(page, '/');
      });

      await test.step('Then the header offers Gyms and does not offer Shop', async () => {
        await headerSection.expectVisible();

        await headerSection.expectPageLink('Gyms', '/gyms');
        await headerSection.expectNoPageLink('Shop');
      });
    },
  );
});
