import { expect, test } from '@ui/fixtures';
import { HEADER_TEST_IDS } from '@ui/pages/sections/header.constants';
import { squash } from '@squash/annotations';

test.describe('Header snapshot acceptance', { tag: ['@layout', '@header', '@snapshot', '@desktop', '@squash'] }, () => {
  test(
    'header logo link should keep its accessible structure',
    {
      tag: ['@smoke', '@acceptance'],
      annotation: squash({ weight: 'high', status: 'approved', nature: 'non functional', type: 'regression' }),
    },
    async ({ page }) => {
      await page.goto('/about');

      await expect(page.getByTestId(HEADER_TEST_IDS.navigation)).toBeVisible();
      await expect(page.getByTestId(HEADER_TEST_IDS.logoLink)).toMatchAriaSnapshot({ name: 'logo-link.aria.yml' });
    },
  );
});
