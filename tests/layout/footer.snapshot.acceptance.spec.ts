import { expect, test } from '@ui/fixtures';
import { squash } from '@squash/annotations';

test.describe('Footer snapshot acceptance', { tag: ['@layout', '@footer', '@snapshot', '@desktop', '@squash'] }, () => {
  test(
    'footer quick links should keep their accessible structure',
    {
      tag: ['@smoke', '@acceptance'],
      annotation: squash({ weight: 'high', status: 'approved', nature: 'non functional', type: 'regression' }),
    },
    async ({ page }) => {
      await page.goto('/about');

      await expect(page.getByRole('contentinfo')).toBeVisible();
      await expect(page.getByRole('contentinfo')).toMatchAriaSnapshot({ name: 'quick-links.aria.yml' });
    },
  );

  test(
    'footer copyright should keep its accessible structure',
    {
      tag: ['@acceptance'],
      annotation: squash({ weight: 'medium', status: 'approved', nature: 'non functional', type: 'regression' }),
    },
    async ({ page }) => {
      await page.goto('/about');

      await expect(page.getByTestId('footer-copyright')).toBeVisible();
      await expect(page.getByTestId('footer-copyright')).toMatchAriaSnapshot({ name: 'copyright.aria.yml' });
    },
  );
});
