import { expect, test } from '@ui/fixtures';

test.describe('About snapshot acceptance', { tag: ['@about', '@snapshot', '@desktop'] }, () => {
  test(
    'Given the About page, when it is displayed, then it matches the approved image',
    { tag: ['@smoke', '@acceptance'] },
    async ({ page, aboutPage }) => {
      await aboutPage.navigate();
      await aboutPage.verifyIsLoaded();
      await expect(page).toHaveScreenshot('about-page.png');
    },
  );

  test(
    'Given the About page, when its sections are displayed, then their accessible structure is preserved',
    { tag: ['@snapshot', '@smoke', '@acceptance'] },
    async ({ page, aboutPage }) => {
      await aboutPage.navigate();
      await aboutPage.verifyIsLoaded();
      await expect(page.getByTestId('about-page-header-title')).toMatchAriaSnapshot({ name: 'header.aria.yml' });
      await expect(page.getByTestId('about-mission-section')).toMatchAriaSnapshot({ name: 'mission.aria.yml' });
      await expect(page.getByTestId('about-values-section')).toMatchAriaSnapshot({ name: 'values.aria.yml' });
      await expect(page.getByTestId('about-contact-section')).toMatchAriaSnapshot({ name: 'contact.aria.yml' });
    },
  );
});
