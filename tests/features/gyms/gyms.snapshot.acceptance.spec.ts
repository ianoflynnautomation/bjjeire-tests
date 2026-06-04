import { expect } from '@playwright/test';
import { test } from '@ui/fixtures';
import * as GymsPage from '@ui/pages/gyms/gyms.page';

test.describe('Gyms snapshot acceptance', { tag: ['@gyms', '@snapshot', '@desktop'] }, () => {
  test('header image snapshot', { tag: '@snapshot' }, async ({ page }) => {
    await GymsPage.navigate();
    await GymsPage.verifyIsLoaded();
    await expect(page.getByTestId('gyms-page-header')).toHaveScreenshot('gyms-header.png');
  });

  test('empty-state ARIA snapshot', { tag: '@snapshot' }, async ({ page }) => {
    await GymsPage.navigate();
    await GymsPage.searchFor('zzz-no-match-xyz');
    await GymsPage.expectNoResults();
    await expect(page.getByTestId('no-data-state')).toMatchAriaSnapshot({ name: 'gyms-empty-state.aria.yml' });
  });
});
