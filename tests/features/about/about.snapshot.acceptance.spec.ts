import { test } from '@ui/fixtures';
import * as AboutPage from '@ui/features/about/about.page';

test.describe('About snapshot acceptance', { tag: ['@about', '@snapshot', '@desktop'] }, () => {
  test('full-page image snapshot', { tag: ['@snapshot', '@smoke'] }, async () => {
    await AboutPage.navigate();
    await AboutPage.verifyIsLoaded();
    await AboutPage.expectScreenshot('about-page.png');
  });

  test('section ARIA snapshots', { tag: ['@snapshot', '@smoke'] }, async () => {
    await AboutPage.navigate();
    await AboutPage.verifyIsLoaded();
    await AboutPage.expectAriaTree('headerTitle', 'header.aria.yml');
    await AboutPage.expectAriaTree('mission', 'mission.aria.yml');
    await AboutPage.expectAriaTree('values', 'values.aria.yml');
    await AboutPage.expectAriaTree('contact', 'contact.aria.yml');
  });
});
