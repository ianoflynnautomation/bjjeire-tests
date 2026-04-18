import { test } from '@fixtures/bjjeire';

test.describe('About @about @smoke', () => {
  test('loads successfully regardless of feature flags @smoke', async ({ aboutPage }) => {
    await aboutPage.navigate();
    await aboutPage.verifyIsLoaded();
  });
});
