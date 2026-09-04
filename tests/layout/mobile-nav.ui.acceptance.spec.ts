import { expect } from '@playwright/test';
import { test } from '@ui/fixtures';
import { HEADER_NAV_LINKS } from '@ui/sections/header.constants';
import { goto } from '@ui/support';

const mobileToggle = 'navigation-mobile-toggle';
const mobilePanel = 'navigation-mobile-panel';

test.describe('Mobile navigation UI acceptance', { tag: ['@layout', '@navigation', '@ui', '@mobile'] }, () => {
  test(
    'Given the mobile header, when the visitor opens the menu, then every section link is listed',
    { tag: '@acceptance' },
    async ({ page }) => {
      await goto(page, '/about');

      await page.getByTestId(mobileToggle).click();

      const panel = page.getByTestId(mobilePanel);
      await expect(panel).toBeVisible();
      for (const { name, path } of HEADER_NAV_LINKS) {
        await expect(panel.getByRole('link', { name, exact: true })).toHaveAttribute('href', path);
      }
    },
  );

  for (const { name, path } of HEADER_NAV_LINKS) {
    test(
      `Given the mobile menu is open, when the visitor selects "${name}", then ${path} is opened and the menu closes`,
      { tag: '@acceptance' },
      async ({ page }) => {
        await goto(page, '/about');
        await page.getByTestId(mobileToggle).click();

        const panel = page.getByTestId(mobilePanel);
        await panel.getByRole('link', { name, exact: true }).click();

        await expect(page).toHaveURL(new RegExp(`${path}(?:[/?#]|$)`));
        await expect(panel).toBeHidden();
      },
    );
  }
});
