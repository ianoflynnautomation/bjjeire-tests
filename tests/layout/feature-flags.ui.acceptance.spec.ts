import { test, expect } from '@ui/fixtures';
import { ALL_FEATURES_ENABLED } from '@ui/fixtures/feature-flags.fixture';
import { goto } from '@ui/support';

test.use({ featureFlagOverrides: { ...ALL_FEATURES_ENABLED, Stores: false } });

test.describe('Disabled feature UI acceptance', { tag: ['@layout', '@routing', '@ui', '@desktop'] }, () => {
  test(
    'Given the stores feature is disabled, when a visitor opens the stores page, then they land on an enabled feature instead',
    { tag: '@acceptance' },
    async ({ page }) => {
      await goto(page, '/stores');

      await expect(page).toHaveURL(/\/events$/);
    },
  );

  test(
    'Given the stores feature is disabled, when a visitor views the header, then stores is not offered',
    { tag: '@acceptance' },
    async ({ page, headerSection }) => {
      await goto(page, '/');
      await headerSection.expectVisible();

      await expect(page.getByRole('navigation').getByRole('link', { name: 'Stores' })).toHaveCount(0);
      await expect(page.getByRole('navigation').getByRole('link', { name: 'Gyms' })).toBeVisible();
    },
  );
});
