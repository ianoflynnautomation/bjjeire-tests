import { test } from '@ui/fixtures';
import { Theme } from '@ui/pages/sections/header.constants';
import { gotoAppShell } from '@ui/support';
import { squash } from '@squash/annotations';

test.describe('Theme UI acceptance', { tag: ['@layout', '@theme', '@ui', '@desktop', '@squash'] }, () => {
  test(
    'visitor should see the site in dark mode by default',
    {
      tag: '@acceptance',
      annotation: squash({ weight: 'medium', status: 'approved', nature: 'functional', type: 'regression' }),
    },
    async ({ page, headerSection }) => {
      await test.step('When a visitor opens the About page', async () => {
        await gotoAppShell(page, '/about');
      });

      await test.step('Then the site is in dark mode', async () => {
        await headerSection.expectTheme(Theme.Dark);
      });
    },
  );

  test(
    'visitor should keep competition mode after reloading the page',
    {
      tag: '@acceptance',
      annotation: squash({ weight: 'medium', status: 'approved', nature: 'functional', type: 'regression' }),
    },
    async ({ page, headerSection }) => {
      await test.step('Given a visitor has switched to competition mode', async () => {
        await gotoAppShell(page, '/about');
        await headerSection.switchTheme(Theme.Competition);
      });

      await test.step('When the visitor reloads the page', async () => {
        await page.reload();
      });

      await test.step('Then the site is still in competition mode', async () => {
        await headerSection.expectTheme(Theme.Competition);
      });
    },
  );

  test(
    'visitor should keep light mode after reloading the page',
    {
      tag: '@acceptance',
      annotation: squash({ weight: 'medium', status: 'approved', nature: 'functional', type: 'regression' }),
    },
    async ({ page, headerSection }) => {
      await test.step('Given a visitor has switched to light mode', async () => {
        await gotoAppShell(page, '/about');
        await headerSection.switchTheme(Theme.Competition);
        await headerSection.switchTheme(Theme.Light);
      });

      await test.step('When the visitor reloads the page', async () => {
        await page.reload();
      });

      await test.step('Then the site is still in light mode', async () => {
        await headerSection.expectTheme(Theme.Light);
      });
    },
  );

  test(
    'visitor should return to dark mode after cycling through every theme',
    {
      tag: '@acceptance',
      annotation: squash({ weight: 'medium', status: 'approved', nature: 'functional', type: 'regression' }),
    },
    async ({ page, headerSection }) => {
      await test.step('When a visitor opens the About page', async () => {
        await gotoAppShell(page, '/about');
      });

      await test.step('And the visitor switches through competition, light and dark mode', async () => {
        await headerSection.switchTheme(Theme.Competition);
        await headerSection.switchTheme(Theme.Light);
        await headerSection.switchTheme(Theme.Dark);
      });

      await test.step('Then the site is in dark mode', async () => {
        await headerSection.expectTheme(Theme.Dark);
      });
    },
  );
});
