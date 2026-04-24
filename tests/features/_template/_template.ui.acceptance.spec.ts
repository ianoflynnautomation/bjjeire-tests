import { test } from '@ui/features/_template/_template.fixture';

// For list-style features, prefer defineListAcceptance from tests/shared/list-acceptance
// and put expected card data under tests/testdata/<feature>.ts.

test.describe('Template UI Acceptance', { tag: ['@template', '@ui', '@desktop'] }, () => {
  test('loads the feature screen', { tag: ['@smoke', '@acceptance'] }, async ({ templateScreen }) => {
    await test.step('Open the feature route', async () => {
      await templateScreen.navigate();
    });

    await test.step('Verify the feature shell is visible', async () => {
      await templateScreen.verifyIsLoaded();
    });
  });
});
