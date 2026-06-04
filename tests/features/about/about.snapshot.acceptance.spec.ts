import { expect } from '@playwright/test';
import { test } from '@ui/fixtures';
import * as AboutPage from '@ui/pages/about/about.page';

test.describe('About snapshot acceptance', { tag: ['@about', '@snapshot', '@desktop'] }, () => {
  test('full-page image snapshot', { tag: ['@smoke'] }, async ({ page }) => {
    await AboutPage.navigate();
    await AboutPage.verifyIsLoaded();
    await expect(page).toHaveScreenshot('about-page.png');
  });

  test('section ARIA snapshots', { tag: ['@snapshot', '@smoke'] }, async ({ page }) => {
    await AboutPage.navigate();
    await AboutPage.verifyIsLoaded();
    await expect(page.getByTestId('about-page-header-title')).toMatchAriaSnapshot({ name: 'header.aria.yml' });
    await expect(page.getByTestId('about-mission-section')).toMatchAriaSnapshot({ name: 'mission.aria.yml' });
    await expect(page.getByTestId('about-values-section')).toMatchAriaSnapshot({ name: 'values.aria.yml' });
    await expect(page.getByTestId('about-contact-section')).toMatchAriaSnapshot({ name: 'contact.aria.yml' });
  });
});
