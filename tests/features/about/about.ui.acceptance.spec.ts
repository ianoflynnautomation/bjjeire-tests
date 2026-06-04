import { test } from '@ui/fixtures';
import * as AboutPage from '@ui/pages/about/about.page';

test.describe('About UI Acceptance', { tag: ['@about', '@ui', '@desktop'] }, () => {
  test('loads successfully', { tag: ['@smoke'] }, async () => {
    await AboutPage.navigate();
    await AboutPage.verifyIsLoaded();
  });
});
