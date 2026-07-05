import { expect, test } from '@ui/fixtures';
import gymsFixture from '../../testdata/mocks/gyms.page-1.json';

test.describe('Gyms snapshot acceptance', { tag: ['@gyms', '@snapshot', '@desktop'] }, () => {
  test.beforeEach(async ({ mockGyms }) => {
    await mockGyms(gymsFixture);
  });

  test(
    'Given the Gyms page, when the header is displayed, then it matches the approved image',
    { tag: ['@acceptance'] },
    async ({ page, gymsPage }) => {
      await gymsPage.goTo();
      await gymsPage.verifyIsLoaded();
      await expect(page.getByTestId('gyms-page-header')).toHaveScreenshot('gyms-header.png');
    },
  );

  test(
    'Given no matching gym, when the empty state is displayed, then its accessible structure is preserved',
    { tag: ['@acceptance'] },
    async ({ page, gymsPage }) => {
      await gymsPage.goTo();
      await gymsPage.searchFor('zzz-no-match-xyz');
      await gymsPage.expectNoResults();
      await expect(page.getByTestId('no-data-state')).toMatchAriaSnapshot({ name: 'gyms-empty-state.aria.yml' });
    },
  );
});
