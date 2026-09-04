import { expect } from '@playwright/test';
import { test } from '@ui/fixtures';
import { HEADER_NAV_LINKS } from '@ui/sections/header.constants';
import { goto } from '@ui/support';

test.describe('Header UI acceptance', { tag: ['@layout', '@header', '@ui', '@desktop'] }, () => {
  for (const { name, path } of HEADER_NAV_LINKS) {
    test(
      `Given the header, when a visitor selects "${name}", then ${path} is opened`,
      { tag: '@acceptance' },
      async ({ page }) => {
        await goto(page, '/about');

        const navigation = page.getByRole('navigation');
        const navLink = navigation.getByRole('link', { name, exact: true });

        await expect(navigation).toBeVisible();
        await expect(navLink).toHaveAttribute('href', path);

        await navLink.click();
        await expect(page).toHaveURL(new RegExp(`${path}(?:[/?#]|$)`));
      },
    );
  }
});
