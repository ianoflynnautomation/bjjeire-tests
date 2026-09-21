import { expect } from '@playwright/test';
import { test } from '@ui/fixtures';
import { goto } from '@ui/support';

const DEFAULT_PATH_PATTERN = /\/events(?:[/?#]|$)/;

test.describe('Routing UI acceptance', { tag: ['@layout', '@routing', '@ui', '@desktop'] }, () => {
  test(
    'Given an unknown URL, when a visitor opens it, then they are redirected to the default page',
    { tag: '@acceptance' },
    async ({ page, eventsPage }) => {
      await goto(page, '/this-page-does-not-exist');
      await expect(page).toHaveURL(DEFAULT_PATH_PATTERN);
      await eventsPage.verifyIsLoaded();
    },
  );

  test(
    'Given the root URL, when a visitor opens it, then the default page is displayed',
    { tag: '@acceptance' },
    async ({ page, eventsPage }) => {
      await goto(page, '/');
      await expect(page).toHaveURL(DEFAULT_PATH_PATTERN);
      await eventsPage.verifyIsLoaded();
    },
  );
});
