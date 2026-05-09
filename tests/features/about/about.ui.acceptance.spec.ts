import { test } from '@ui/features/about/about.fixture';
import * as AboutPage from '@ui/features/about/about.page';

test.describe('About UI Acceptance', { tag: ['@about', '@ui', '@desktop'] }, () => {
  test(
    'loads successfully',
    {
      tag: ['@smoke', '@acceptance', '@mobile'],
    },
    async () => {
      await AboutPage.navigate();
      await AboutPage.verifyIsLoaded();
    },
  );
});
