import { test } from '@features/_template/_template.fixture';

test.describe('Template @template @desktop', () => {
  test('loads the feature screen @smoke', async ({ templateScreen }) => {
    await test.step('Open the feature route', async () => {
      await templateScreen.navigate();
    });

    await test.step('Verify the feature shell is visible', async () => {
      await templateScreen.verifyIsLoaded();
    });
  });
});
