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
      const html = page.locator('html');

      await test.step('When a visitor opens the About page', async () => {
        await gotoAppShell(page, '/about');
      });

      await test.step('Then the site is in dark mode', async () => {
        await expect(html).toHaveClass(/dark/);
        await expect(html).not.toHaveClass(/competition/);
      });

      await test.step('When the visitor switches to competition mode', async () => {
        await page.getByRole('button', { name: 'Switch to competition mode' }).click();
      });

      await test.step('Then competition mode is applied', async () => {
        await expect(html).toHaveClass(/competition/);
      });

      await test.step('When the visitor reloads the page', async () => {
        await page.reload();
      });

      await test.step('Then competition mode is kept', async () => {
        await expect(html).toHaveClass(/competition/);
      });

      await test.step('When the visitor switches to light mode', async () => {
        await page.getByRole('button', { name: 'Switch to light mode' }).click();
      });

      await test.step('Then light mode is applied', async () => {
        await expect(html).not.toHaveClass(/dark/);
        await expect(html).not.toHaveClass(/competition/);
      });

      await test.step('When the visitor reloads the page', async () => {
        await page.reload();
      });

      await test.step('Then light mode is kept', async () => {
        await expect(html).not.toHaveClass(/dark/);
      });

      await test.step('When the visitor switches to dark mode', async () => {
        await page.getByRole('button', { name: 'Switch to dark mode' }).click();
      });

      await test.step('Then dark mode is applied', async () => {
        await expect(html).toHaveClass(/dark/);
        await expect(html).not.toHaveClass(/competition/);
      });
    },
  );
});
