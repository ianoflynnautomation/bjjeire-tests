import { expect } from '@playwright/test';
import { test } from '@ui/fixtures';

test.describe('Footer snapshot acceptance', { tag: ['@layout', '@footer', '@snapshot', '@desktop'] }, () => {
  test('quick links ARIA snapshot', { tag: ['@snapshot', '@smoke'] }, async ({ page }) => {
    await page.goto('/about');

    await expect(page.getByRole('contentinfo')).toBeVisible();
    await expect(page.getByRole('contentinfo')).toMatchAriaSnapshot({ name: 'quick-links.aria.yml' });
  });

  test('copyright ARIA snapshot', { tag: '@snapshot' }, async ({ page }) => {
    await page.goto('/about');

    await expect(page.getByTestId('footer-copyright')).toBeVisible();
    await expect(page.getByTestId('footer-copyright')).toMatchAriaSnapshot({ name: 'copyright.aria.yml' });
  });
});
