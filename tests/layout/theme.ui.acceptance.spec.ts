import { test, expect } from '@ui/fixtures';
import { gotoAppShell } from '@ui/support';
import { squash } from '@squash/annotations';

test.describe('Theme UI acceptance', { tag: ['@layout', '@theme', '@ui', '@desktop', '@squash'] }, () => {
  test(
    'visitor should be able to cycle through the themes, each applied and kept across reloads',
    {
      tag: '@acceptance',
      annotation: squash({ weight: 'medium', status: 'approved', nature: 'functional', type: 'regression' }),
    },
    async ({ page }) => {
      await gotoAppShell(page, '/about');
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
