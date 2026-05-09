import { test } from '@ui/features/gyms/gyms.fixture';
import * as GymsPage from '@ui/features/gyms/gyms.page';

test.describe('Gyms snapshot acceptance', { tag: ['@gyms', '@snapshot', '@desktop'] }, () => {
  test('header image snapshot', { tag: '@snapshot' }, async () => {
    await GymsPage.navigate();
    await GymsPage.verifyIsLoaded();
    await GymsPage.expectScreenshot('gyms-header.png', { region: 'header' });
  });

  test('empty-state ARIA snapshot', { tag: '@snapshot' }, async () => {
    await GymsPage.navigate();
    await GymsPage.searchFor('zzz-no-match-xyz');
    await GymsPage.expectNoResults();
    await GymsPage.stabilize();
    await GymsPage.expectAriaTree('emptyState', 'gyms-empty-state.aria.yml');
  });
});
