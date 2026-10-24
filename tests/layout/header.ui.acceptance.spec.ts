import { test, expect } from '@ui/fixtures';
import { HEADER_NAV_LINKS, HEADER_TEST_IDS } from '@ui/pages/sections/header.constants';
import { gotoAppShell } from '@ui/support';
import { squash } from '@squash/annotations';

test.describe('Header UI acceptance', { tag: ['@layout', '@header', '@ui', '@desktop', '@squash'] }, () => {
  for (const { name, path } of HEADER_NAV_LINKS) {
    test(
      `visitor should open ${path} by selecting "${name}" in the header`,
      {
        tag: '@acceptance',
        annotation: squash({ weight: 'medium', status: 'approved', nature: 'functional', type: 'regression' }),
      },
      async ({ page }) => {
        await gotoAppShell(page, '/about');

        const navigation = page.getByTestId(HEADER_TEST_IDS.navigation);
        const navLink = navigation.getByRole('link', { name, exact: true });

        await expect(navigation).toBeVisible();
        await expect(navLink).toHaveAttribute('href', path);

        await navLink.click();
        await expect(page).toHaveURL(new RegExp(`${path}(?:[/?#]|$)`));
      },
    );
  }
});
