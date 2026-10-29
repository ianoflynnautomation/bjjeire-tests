import { TIMEOUTS } from '@shared/config/timeouts';
import { test, expect } from '@ui/fixtures';
import { expectNoWcagViolations, gotoRoute } from '@ui/support';
import { squash } from '@squash/annotations';

const ROUTES = [
  { name: 'Events', path: '/events', readyTestId: 'events-list-item' },
  { name: 'Gyms', path: '/gyms', readyTestId: 'gyms-list-item' },
  { name: 'Competitions', path: '/competitions', readyTestId: 'competitions-list-item' },
  { name: 'Stores', path: '/stores', readyTestId: 'stores-list-item' },
  { name: 'About', path: '/about', readyTestId: 'about-page' },
] as const;

test.describe('Accessibility acceptance', { tag: ['@a11y', '@desktop', '@squash'] }, () => {
  for (const { name, path, readyTestId } of ROUTES) {
    test(
      `${name} page should have no WCAG 2.1 A/AA violations`,
      {
        tag: '@acceptance',
        annotation: squash({ weight: 'medium', status: 'approved', nature: 'non functional', type: 'regression' }),
      },
      async ({ page }) => {
        test.setTimeout(TIMEOUTS.max);
        const ready = page.getByTestId(readyTestId).first();
        await gotoRoute(page, path, ready);
        await expect(ready).toBeVisible();

        await expectNoWcagViolations(page);
      },
    );
  }
});
