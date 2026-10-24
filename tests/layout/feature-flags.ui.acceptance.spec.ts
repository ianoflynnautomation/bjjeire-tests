import { test, expect } from '@ui/fixtures';
import { ALL_FEATURES_ENABLED } from '@ui/fixtures/feature-flags.fixture';
import { HEADER_TEST_IDS } from '@ui/pages/sections/header.constants';
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
      await gotoAppShell(page, '/stores');

      await expect(page).toHaveURL(/\/events$/);
    },
  );

  test(
    'visitor should not be offered stores in the header when the feature is disabled',
    {
      tag: '@acceptance',
      annotation: squash({ weight: 'medium', status: 'approved', nature: 'functional', type: 'regression' }),
    },
    async ({ page, headerSection }) => {
      await gotoAppShell(page, '/');
      await headerSection.expectVisible();

      const navigation = page.getByTestId(HEADER_TEST_IDS.navigation);
      await expect(navigation.getByRole('link', { name: 'Stores' })).toHaveCount(0);
      await expect(navigation.getByRole('link', { name: 'Gyms' })).toBeVisible();
    },
  );
});
