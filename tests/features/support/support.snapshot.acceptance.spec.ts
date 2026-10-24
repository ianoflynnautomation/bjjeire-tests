import { expect, test } from '@ui/fixtures';
import { squash } from '@squash/annotations';

test.describe('Support snapshot acceptance', { tag: ['@support', '@snapshot', '@desktop', '@squash'] }, () => {
  test(
    'bitcoin support modal should keep its accessible structure',
    {
      tag: ['@acceptance'],
      annotation: squash({ weight: 'medium', status: 'approved', nature: 'non functional', type: 'regression' }),
    },
    async ({ page, headerSection }) => {
      await page.goto('/');
      await headerSection.clickSupportButton();
      await expect(page.getByTestId('support-modal-overlay')).toMatchAriaSnapshot({ name: 'bitcoin-support.aria.yml' });
    },
  );
});
