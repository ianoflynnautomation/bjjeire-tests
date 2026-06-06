import { expect, test } from '@ui/fixtures';

test.describe('About snapshot acceptance', { tag: ['@about', '@snapshot', '@desktop'] }, () => {
  test('full-page image snapshot', { tag: ['@smoke'] }, async ({ page, aboutPage }) => {
    await aboutPage.navigate();
    await aboutPage.verifyIsLoaded();
    await expect(page).toHaveScreenshot('about-page.png');
  });

  test('section ARIA snapshots', { tag: ['@snapshot', '@smoke'] }, async ({ page, aboutPage }) => {
    await aboutPage.navigate();
    await aboutPage.verifyIsLoaded();
    await expect(page.getByTestId('about-page-header-title')).toMatchAriaSnapshot({ name: 'header.aria.yml' });
    await expect(page.getByTestId('about-mission-section')).toMatchAriaSnapshot({ name: 'mission.aria.yml' });
    await expect(page.getByTestId('about-values-section')).toMatchAriaSnapshot({ name: 'values.aria.yml' });
    await expect(page.getByTestId('about-contact-section')).toMatchAriaSnapshot({ name: 'contact.aria.yml' });
  });
});
