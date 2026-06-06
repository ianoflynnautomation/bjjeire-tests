import { test } from '@ui/fixtures';

test.describe('About UI Acceptance', { tag: ['@about', '@ui', '@desktop'] }, () => {
  test('loads successfully', { tag: ['@smoke'] }, async ({ aboutPage }) => {
    await aboutPage.navigate();
    await aboutPage.verifyIsLoaded();
  });
});
