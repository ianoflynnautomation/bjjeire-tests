import { expect, test, aboutTestConfig } from './fixtures';
import { squash } from '@squash/annotations';

test.use(aboutTestConfig);

test.describe('About snapshot acceptance', { tag: ['@about', '@snapshot', '@desktop', '@squash'] }, () => {
  test.skip(
    'About page should match the approved image',
    {
      tag: ['@smoke', '@acceptance'],
      annotation: squash({ weight: 'high', status: 'approved', nature: 'non functional', type: 'regression' }),
    },
    async ({ page, aboutPage }) => {
      await aboutPage.navigate();
      await aboutPage.verifyIsLoaded();
      await expect(page).toHaveScreenshot('about-page.png');
    },
  );

  test.skip(
    'About page sections should keep their accessible structure',
    {
      tag: ['@smoke', '@acceptance'],
      annotation: squash({ weight: 'high', status: 'approved', nature: 'non functional', type: 'regression' }),
    },
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
