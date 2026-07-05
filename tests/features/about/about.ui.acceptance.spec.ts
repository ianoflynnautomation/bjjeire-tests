import { test } from '@ui/fixtures';

test.describe('About UI acceptance', { tag: ['@about', '@ui', '@desktop'] }, () => {
  test(
    'Given a visitor, when they open the About page, then the page is displayed',
    { tag: ['@smoke', '@acceptance'] },
    async ({ aboutPage }) => {
      await aboutPage.navigate();
      await aboutPage.verifyIsLoaded();
    },
  );
});
