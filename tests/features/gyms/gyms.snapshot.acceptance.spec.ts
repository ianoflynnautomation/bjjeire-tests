import { test } from '@ui/fixtures';

test.describe('Gyms snapshot acceptance', { tag: ['@gyms', '@snapshot', '@desktop'] }, () => {
  test.beforeEach(({ featureFlags }) => {
    test.skip(!featureFlags.Gyms, "feature 'Gyms' disabled");
  });

  test('header image snapshot', { tag: '@snapshot' }, async ({ gymsScreen }) => {
    await gymsScreen.navigate();
    await gymsScreen.verifyIsLoaded();
    await gymsScreen.expectScreenshot('gyms-header.png', { region: 'header' });
  });

  test('empty-state ARIA snapshot', { tag: '@snapshot' }, async ({ gymsScreen }) => {
    await gymsScreen.navigate();
    await gymsScreen.searchFor('zzz-no-match-xyz');
    await gymsScreen.expectNoResults();
    await gymsScreen.stabilize();
    await gymsScreen.expectAriaTree('emptyState', 'gyms-empty-state.aria.yml');
  });
});
