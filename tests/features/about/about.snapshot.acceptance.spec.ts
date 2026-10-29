import { expect, test, aboutTestConfig } from './fixtures';
import { squash } from '@squash/annotations';

test.use(aboutTestConfig);

// Quarantined since 67bc006 (2026-08-08): baselines are stale. Regenerate with
// /update-snapshots, then drop the @quarantine tags.
test.describe('About snapshot acceptance', { tag: ['@about', '@snapshot', '@desktop', '@squash'] }, () => {
  test(
    'About page should match the approved image',
    {
      tag: ['@smoke', '@acceptance', '@quarantine'],
      annotation: squash({ weight: 'high', status: 'approved', nature: 'non functional', type: 'regression' }),
    },
    async ({ page, aboutPage }) => {
      await aboutPage.navigate();
      await aboutPage.verifyIsLoaded();
      await expect(page).toHaveScreenshot('about-page.png');
    },
  );

  test(
    'About page sections should keep their accessible structure',
    {
      tag: ['@smoke', '@acceptance', '@quarantine'],
      annotation: squash({ weight: 'high', status: 'approved', nature: 'non functional', type: 'regression' }),
    },
    async ({ aboutPage }) => {
      await aboutPage.navigate();
      await aboutPage.verifyIsLoaded();
      await expect(aboutPage.headerTitle).toMatchAriaSnapshot({ name: 'header.aria.yml' });
      await expect(aboutPage.missionSection).toMatchAriaSnapshot({ name: 'mission.aria.yml' });
      await expect(aboutPage.valuesSection).toMatchAriaSnapshot({ name: 'values.aria.yml' });
      await expect(aboutPage.contactSection).toMatchAriaSnapshot({ name: 'contact.aria.yml' });
    },
  );
});
