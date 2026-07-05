import { expect } from '@playwright/test';
import { test } from '@ui/fixtures';

test.describe('Theme UI acceptance', { tag: ['@layout', '@theme', '@ui', '@desktop'] }, () => {
  test(
    'Given dark mode, when the visitor toggles the theme, then light mode is applied and persists across reloads',
    { tag: '@acceptance' },
    async ({ page }) => {
      await page.goto('/about');
      const html = page.locator('html');
      await expect(html).toHaveClass(/dark/);

      await page.getByRole('button', { name: 'Switch to light mode' }).click();
      await expect(html).not.toHaveClass(/dark/);

      await page.reload();
      await expect(html).not.toHaveClass(/dark/);

      await page.getByRole('button', { name: 'Switch to dark mode' }).click();
      await expect(html).toHaveClass(/dark/);
    },
  );
});
