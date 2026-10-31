import { test, expect } from '@ui/fixtures';
import { expectNoSidewaysScroll, gotoAppShell } from '@ui/support';
import { squash } from '@squash/annotations';

const NARROWEST_PHONE = { width: 320, height: 740 } as const;
const SCREEN_WIDTHS = {
  phone: 360,
  largePhone: 430,
  smallTablet: 640,
  midTablet: 700,
  tablet: 768,
  laptop: 1024,
} as const;

const ROUTES = [
  { name: 'Events', path: '/events', readyTestId: 'events-list-item' },
  { name: 'Gyms', path: '/gyms', readyTestId: 'gyms-list-item' },
  { name: 'Competitions', path: '/competitions', readyTestId: 'competitions-list-item' },
  { name: 'Stores', path: '/stores', readyTestId: 'stores-list-item' },
] as const;

test.describe('Page structure UI acceptance', { tag: ['@layout', '@ui', '@desktop', '@squash'] }, () => {
  for (const { name, path, readyTestId } of ROUTES) {
    test(
      `${name} page should have one main heading`,
      {
        tag: '@acceptance',
        annotation: squash({
          weight: 'medium',
          status: 'work in progress',
          nature: 'non functional',
          type: 'regression',
        }),
      },
      async ({ page }) => {
        await test.step(`When a visitor opens ${name}`, async () => {
          await gotoAppShell(page, path);
        });

        await test.step('Then the page has one main heading', async () => {
          await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
        });
      },
    );

    test.describe('on the narrowest phone', () => {
      test.use({ viewport: NARROWEST_PHONE });

      test(
        `visitor should not need to scroll ${name} sideways on the narrowest phone`,
        {
          tag: '@acceptance',
          annotation: squash({
            weight: 'medium',
            status: 'work in progress',
            nature: 'non functional',
            type: 'regression',
          }),
        },
        async ({ page, headerSection }) => {
          await test.step(`When a visitor opens ${name} on a 320px phone`, async () => {
            await gotoAppShell(page, path);
            await expect(page.getByTestId(readyTestId).first()).toBeVisible();
          });

          await test.step('Then the page fits the screen and the header controls clear the logo', async () => {
            await expectNoSidewaysScroll(page);
            await headerSection.expectLogoClearOfControls();
          });
        },
      );
    });
  }

  test(
    'visitor should not need to scroll sideways at common screen widths',
    {
      tag: '@acceptance',
      annotation: squash({
        weight: 'medium',
        status: 'work in progress',
        nature: 'non functional',
        type: 'regression',
      }),
    },
    async ({ page, headerSection }) => {
      await test.step('When a visitor opens Stores', async () => {
        await gotoAppShell(page, '/stores');
        await expect(page.getByTestId('stores-list-item').first()).toBeVisible();
      });

      for (const width of Object.values(SCREEN_WIDTHS)) {
        await test.step(`Then the page fits a ${width}px screen`, async () => {
          await page.setViewportSize({ width, height: NARROWEST_PHONE.height });
          await expectNoSidewaysScroll(page);
          await headerSection.expectLogoClearOfControls();
        });
      }
    },
  );
});
