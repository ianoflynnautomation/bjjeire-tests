import { expect } from '@playwright/test';
import { test } from '@ui/fixtures';

test.describe('Header snapshot acceptance', { tag: ['@layout', '@header', '@snapshot', '@desktop'] }, () => {
  test('logo link ARIA snapshot', { tag: ['@snapshot', '@smoke'] }, async ({ page }) => {
    await page.goto('/about');

    await expect(page.getByRole('navigation')).toBeVisible();
    await expect(page.getByTestId('navigation-logo-link')).toMatchAriaSnapshot({ name: 'logo-link.aria.yml' });
  });
});
