import { test, expect } from '@ui/fixtures';
import { HEADER_NAV_LINKS } from '@ui/pages/sections/header.constants';
import { gotoAppShell } from '@ui/support';
import { squash } from '@squash/annotations';

const mobileToggle = 'navigation-mobile-toggle';
const mobilePanel = 'navigation-mobile-panel';

test.describe(
  'Mobile navigation UI acceptance',
  { tag: ['@layout', '@navigation', '@ui', '@mobile', '@squash'] },
  () => {
    test(
      'visitor should see every section link after opening the mobile menu',
      {
        tag: '@acceptance',
        annotation: squash({ weight: 'medium', status: 'approved', nature: 'functional', type: 'regression' }),
      },
      async ({ page }) => {
        await test.step('When a visitor opens the About page', async () => {
          await gotoAppShell(page, '/about');
        });

        await test.step('And the visitor opens the mobile menu', async () => {
          await page.getByTestId(mobileToggle).click();
        });

        await test.step('Then every section link is shown', async () => {
          const panel = page.getByTestId(mobilePanel);
          await expect(panel).toBeVisible();
          for (const { name, path } of HEADER_NAV_LINKS) {
            await expect(panel.getByRole('link', { name, exact: true })).toHaveAttribute('href', path);
          }
        });
      },
    );

    for (const { name, path } of HEADER_NAV_LINKS) {
      test(
        `visitor should open ${path} and close the menu by selecting "${name}" in the mobile menu`,
        {
          tag: '@acceptance',
          annotation: squash({ weight: 'medium', status: 'approved', nature: 'functional', type: 'regression' }),
        },
        async ({ page }) => {
          await test.step('When a visitor opens the About page', async () => {
            await gotoAppShell(page, '/about');
          });

          await test.step('And the visitor opens the mobile menu', async () => {
            await page.getByTestId(mobileToggle).click();
          });

          const panel = page.getByTestId(mobilePanel);

          await test.step(`And the visitor selects "${name}"`, async () => {
            await panel.getByRole('link', { name, exact: true }).click();
          });

          await test.step(`Then ${path} opens and the menu closes`, async () => {
            await expect(page).toHaveURL(new RegExp(`${path}(?:[/?#]|$)`));
            await expect(panel).toBeHidden();
          });
        },
      );
    }
  },
);
