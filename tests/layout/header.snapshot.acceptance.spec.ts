import { expect, test } from '@ui/fixtures';
import { HEADER_TEST_IDS } from '@ui/pages/sections/header.constants';

test.describe('Header snapshot acceptance', { tag: ['@layout', '@header', '@snapshot', '@desktop'] }, () => {
  test(
    'Given the site header, when the logo link is displayed, then its accessible structure is preserved',
    { tag: ['@smoke', '@acceptance'] },
    async ({ page }) => {
      await page.goto('/about');

      await expect(page.getByTestId(HEADER_TEST_IDS.navigation)).toBeVisible();
      await expect(page.getByTestId(HEADER_TEST_IDS.logoLink)).toMatchAriaSnapshot({ name: 'logo-link.aria.yml' });
    },
  );
});
