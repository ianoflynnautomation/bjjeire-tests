import { test } from '@ui/fixtures';
import * as TemplatePage from '@ui/pages/_template/_template.page';

// For list-style features, prefer defineListAcceptance from tests/shared/list-acceptance
// and put expected card data under tests/testdata/<feature>.ts.

test.describe('Template UI Acceptance', { tag: ['@template', '@ui', '@desktop'] }, () => {
  test('loads the feature screen', { tag: ['@smoke', '@acceptance'] }, async () => {
    await TemplatePage.navigate();
    await TemplatePage.verifyIsLoaded();
  });
});
