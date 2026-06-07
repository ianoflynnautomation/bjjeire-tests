import { test } from '@ui/fixtures';

// For list-style features, prefer defineListAcceptance from tests/shared/list-acceptance
// and put expected card data under tests/testdata/<feature>.ts.

test.describe('Template UI acceptance', { tag: ['@template', '@ui', '@desktop'] }, () => {
  test(
    'Given available feature data, when a visitor opens the feature, then the feature screen is displayed',
    { tag: ['@smoke', '@acceptance'] },
    async ({ templatePage }) => {
      await templatePage.navigate();
      await templatePage.verifyIsLoaded();
    },
  );
});
