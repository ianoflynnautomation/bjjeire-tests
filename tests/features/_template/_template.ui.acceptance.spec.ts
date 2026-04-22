import { test } from '@ui/features/_template/_template.fixture';

test.describe('Template UI Acceptance @template @ui @desktop', () => {
  test('loads the feature screen @smoke @acceptance', async ({ templateScreen }) => {
    await test.step('Open the feature route', async () => {
      await templateScreen.navigate();
    });

    await test.step('Verify the feature shell is visible', async () => {
      await templateScreen.verifyIsLoaded();
    });
  });
});
