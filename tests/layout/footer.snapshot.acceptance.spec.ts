import { expect, test } from '@ui/fixtures';

test.describe('Footer snapshot acceptance', { tag: ['@layout', '@footer', '@snapshot', '@desktop'] }, () => {
  test(
    'Given the site footer, when quick links are displayed, then their accessible structure is preserved',
    { tag: ['@smoke', '@acceptance'] },
    async ({ page }) => {
      await page.goto('/about');

      await expect(page.getByRole('contentinfo')).toBeVisible();
      await expect(page.getByRole('contentinfo')).toMatchAriaSnapshot({ name: 'quick-links.aria.yml' });
    },
  );

  test(
    'Given the site footer, when copyright is displayed, then its accessible structure is preserved',
    { tag: ['@acceptance'] },
    async ({ page }) => {
      await page.goto('/about');

      await expect(page.getByTestId('footer-copyright')).toBeVisible();
      await expect(page.getByTestId('footer-copyright')).toMatchAriaSnapshot({ name: 'copyright.aria.yml' });
    },
  );
});
