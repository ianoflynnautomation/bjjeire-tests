import { expect, test, gymsTestConfig } from './fixtures';
import gymsFixture from './testdata/gyms.page-1.json';
import { squash } from '@squash/annotations';

test.use(gymsTestConfig);

// Quarantined since 67bc006 (2026-08-08): baselines are stale. Regenerate with
// /update-snapshots, then drop the @quarantine tags.
test.describe('Gyms snapshot acceptance', { tag: ['@gyms', '@snapshot', '@desktop', '@squash'] }, () => {
  test.beforeEach(async ({ mockGyms }) => {
    await mockGyms(gymsFixture);
  });

  test(
    'Gyms page header should match the approved image',
    {
      tag: ['@acceptance', '@quarantine'],
      annotation: squash({ weight: 'medium', status: 'approved', nature: 'non functional', type: 'regression' }),
    },
    async ({ gymsPage }) => {
      await gymsPage.goTo();
      await gymsPage.verifyIsLoaded();
      await expect(gymsPage.header).toHaveScreenshot('gyms-header.png');
    },
  );

  test(
    'Gyms empty state should keep its accessible structure',
    {
      tag: ['@acceptance', '@quarantine'],
      annotation: squash({ weight: 'medium', status: 'approved', nature: 'non functional', type: 'regression' }),
    },
    async ({ gymsPage }) => {
      await gymsPage.goTo();
      await gymsPage.searchFor('zzz-no-match-xyz');
      await gymsPage.expectNoResults();
      await expect(gymsPage.emptyState).toMatchAriaSnapshot({ name: 'gyms-empty-state.aria.yml' });
    },
  );
});
