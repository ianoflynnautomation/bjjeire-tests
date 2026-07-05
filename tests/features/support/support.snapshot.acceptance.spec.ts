import { clickSupportButton } from '@ui/sections/header.section';
import { expect } from '@playwright/test';
import { test } from '@ui/fixtures';

test.describe('Bitcoin support acceptance', { tag: ['@support', '@snapshot'] }, () => {
  test(
    'Given the bitcoin support, when support modal is displayed, then its accessible structure is preserved',
    { tag: ['@snapshot', '@acceptance'] },
    async ({ page }) => {
      await page.goto('/');
      await clickSupportButton(page);
      await expect(page.getByTestId('support-modal-overlay')).toMatchAriaSnapshot({ name: 'bitcoin-support.aria.yml' });
    },
  );
});
