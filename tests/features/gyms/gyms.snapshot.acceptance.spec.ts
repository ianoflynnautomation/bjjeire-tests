import { expect, test, gymsTestConfig } from './fixtures';
import gymsFixture from './testdata/gyms.page-1.json';
import { squash } from '@squash/annotations';

test.use(gymsTestConfig);

test.describe('Gyms snapshot acceptance', { tag: ['@gyms', '@snapshot', '@desktop', '@squash'] }, () => {
  test.beforeEach(async ({ mockGyms }) => {
    await mockGyms(gymsFixture);
  });

  test.skip(
    'Gyms page header should match the approved image',
    {
      tag: ['@acceptance'],
      annotation: squash({ weight: 'medium', status: 'approved', nature: 'non functional', type: 'regression' }),
    },
    async ({ page, gymsPage }) => {
      await gymsPage.goTo();
      await gymsPage.verifyIsLoaded();
      await expect(page.getByTestId('gyms-page-header')).toHaveScreenshot('gyms-header.png');
    },
  );

  test.skip(
    'Gyms empty state should keep its accessible structure',
    {
      tag: ['@acceptance'],
      annotation: squash({ weight: 'medium', status: 'approved', nature: 'non functional', type: 'regression' }),
    },
    async ({ page, gymsPage }) => {
      await gymsPage.goTo();
      await gymsPage.searchFor('zzz-no-match-xyz');
      await gymsPage.expectNoResults();
      await expect(page.getByTestId('no-data-state')).toMatchAriaSnapshot({ name: 'gyms-empty-state.aria.yml' });
    },
  );
});
