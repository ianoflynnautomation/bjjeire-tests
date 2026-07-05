import { expect } from '@playwright/test';
import { test } from '@ui/fixtures';
import { FOOTER_QUICK_LINKS } from '@ui/sections/footer.constants';

test.describe('Footer UI acceptance', { tag: ['@layout', '@footer', '@ui', '@desktop'] }, () => {
  for (const { name, path } of FOOTER_QUICK_LINKS) {
    test(
      `Given the footer, when a visitor selects "${name}", then ${path} is opened`,
      { tag: '@acceptance' },
      async ({ page }) => {
        await page.goto('/about');

        const footer = page.getByRole('contentinfo');
        const quickLink = footer.getByRole('link', { name, exact: true });

        await expect(footer).toBeVisible();
        await expect(quickLink).toHaveAttribute('href', path);

        await quickLink.click();
        await expect(page).toHaveURL(new RegExp(`${path}(?:[/?#]|$)`));
      },
    );
  }
});
