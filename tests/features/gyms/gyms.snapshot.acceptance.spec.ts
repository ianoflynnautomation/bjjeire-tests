import { expect, test } from '@ui/fixtures';

test.describe('Gyms snapshot acceptance', { tag: ['@gyms', '@snapshot', '@desktop'] }, () => {
  test('header image snapshot', { tag: '@snapshot' }, async ({ page, gymsPage }) => {
    await gymsPage.navigate();
    await gymsPage.verifyIsLoaded();
    await expect(page.getByTestId('gyms-page-header')).toHaveScreenshot('gyms-header.png');
  });

  test('empty-state ARIA snapshot', { tag: '@snapshot' }, async ({ page, gymsPage }) => {
    await gymsPage.navigate();
    await gymsPage.searchFor('zzz-no-match-xyz');
    await gymsPage.expectNoResults();
    await expect(page.getByTestId('no-data-state')).toMatchAriaSnapshot({ name: 'gyms-empty-state.aria.yml' });
  });
});
