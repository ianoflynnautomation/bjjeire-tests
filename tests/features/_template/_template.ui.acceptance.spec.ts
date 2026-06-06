import { test } from '@ui/fixtures';

// For list-style features, prefer defineListAcceptance from tests/shared/list-acceptance
// and put expected card data under tests/testdata/<feature>.ts.

test.describe('Template UI Acceptance', { tag: ['@template', '@ui', '@desktop'] }, () => {
  test('loads the feature screen', { tag: ['@smoke', '@acceptance'] }, async ({ templatePage }) => {
    await templatePage.navigate();
    await templatePage.verifyIsLoaded();
  });
});
