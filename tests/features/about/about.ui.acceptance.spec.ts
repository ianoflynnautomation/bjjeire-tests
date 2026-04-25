import { test } from '@ui/fixtures';

test.describe('About UI Acceptance', { tag: ['@about', '@ui', '@desktop'] }, () => {
  test(
    'loads successfully regardless of feature flags',
    {
      tag: ['@smoke', '@acceptance', '@mobile'],
    },
    async ({ aboutScreen }) => {
      await aboutScreen.navigate();
      await aboutScreen.verifyIsLoaded();
    },
  );
});
