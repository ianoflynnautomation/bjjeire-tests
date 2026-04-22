import { test } from '@ui/fixtures';

test.describe('About UI Acceptance @about @ui @desktop', () => {
  test('loads successfully regardless of feature flags @smoke @acceptance @mobile', async ({ aboutScreen }) => {
    await test.step('Given user can access About page', async () => {
      await aboutScreen.navigate();
      await aboutScreen.verifyIsLoaded();
    });

    await test.step('Then user should be able to view all about sections', async () => {
      await aboutScreen.verifyOurMissionSection();
      await aboutScreen.verifyValuesSection();
      await aboutScreen.verifyContactSection();
    });
  });
});
