import { expect, test } from '@ui/fixtures';

test.describe('Header snapshot acceptance', { tag: ['@layout', '@header', '@snapshot', '@desktop'] }, () => {
  test(
    'Given the site header, when the logo link is displayed, then its accessible structure is preserved',
    { tag: ['@smoke', '@acceptance'] },
    async ({ page }) => {
      await page.goto('/about');

      await expect(page.getByRole('navigation')).toBeVisible();
      await expect(page.getByTestId('navigation-logo-link')).toMatchAriaSnapshot({ name: 'logo-link.aria.yml' });
    },
  );
});
