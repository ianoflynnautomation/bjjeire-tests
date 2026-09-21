import { expect } from '@playwright/test';
import { test } from '@ui/fixtures';
import { goto } from '@ui/support';

test.describe('Theme UI acceptance', { tag: ['@layout', '@theme', '@ui', '@desktop'] }, () => {
  test(
    'Given the theme control, when the visitor cycles through the themes, then each is applied and persists across reloads',
    { tag: '@acceptance' },
    async ({ page }) => {
      await goto(page, '/about');
      const html = page.locator('html');

      await expect(html).toHaveClass(/dark/);
      await expect(html).not.toHaveClass(/competition/);
      await page.getByRole('button', { name: 'Switch to competition mode' }).click();
      await expect(html).toHaveClass(/competition/);
      await page.reload();
      await expect(html).toHaveClass(/competition/);

      await page.getByRole('button', { name: 'Switch to light mode' }).click();
      await expect(html).not.toHaveClass(/dark/);
      await expect(html).not.toHaveClass(/competition/);
      await page.reload();
      await expect(html).not.toHaveClass(/dark/);
      await page.getByRole('button', { name: 'Switch to dark mode' }).click();
      await expect(html).toHaveClass(/dark/);
      await expect(html).not.toHaveClass(/competition/);
    },
  );
});
