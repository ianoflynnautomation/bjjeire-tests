import { test } from '@core/fixtures';

test.describe('About @about @desktop', () => {
  test('loads successfully regardless of feature flags @smoke @mobile', async ({ aboutScreen }) => {
    await test.step('Open the about route', async () => {
      await aboutScreen.navigate();
    });

    await test.step('Verify the about screen is visible', async () => {
      await aboutScreen.verifyIsLoaded();
    });
  });
});
