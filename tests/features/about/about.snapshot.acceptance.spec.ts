import { test } from '@ui/fixtures';

test.describe('About snapshot acceptance', { tag: ['@about', '@snapshot', '@desktop'] }, () => {
  test('full-page image snapshot', { tag: ['@snapshot', '@smoke'] }, async ({ aboutScreen }) => {
    await aboutScreen.navigate();
    await aboutScreen.verifyIsLoaded();
    await aboutScreen.expectScreenshot('about-page.png');
  });

  test('section ARIA snapshots', { tag: ['@snapshot', '@smoke'] }, async ({ aboutScreen }) => {
    await aboutScreen.navigate();
    await aboutScreen.verifyIsLoaded();
    await aboutScreen.expectAriaTree('headerTitle', 'header.aria.yml');
    await aboutScreen.expectAriaTree('mission', 'mission.aria.yml');
    await aboutScreen.expectAriaTree('values', 'values.aria.yml');
    await aboutScreen.expectAriaTree('contact', 'contact.aria.yml');
  });
});
