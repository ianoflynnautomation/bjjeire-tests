import { expect, test } from '@ui/fixtures';

test.describe('Support snapshot acceptance', { tag: ['@support', '@snapshot', '@desktop'] }, () => {
  test(
    'Given the bitcoin support, when support modal is displayed, then its accessible structure is preserved',
    { tag: ['@acceptance'] },
    async ({ page, headerSection }) => {
      await page.goto('/');
      await headerSection.clickSupportButton();
      await expect(page.getByTestId('support-modal-overlay')).toMatchAriaSnapshot({ name: 'bitcoin-support.aria.yml' });
    },
  );
});
