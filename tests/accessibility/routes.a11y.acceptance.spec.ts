import { AxeBuilder } from '@axe-core/playwright';
import { TIMEOUTS } from '@shared/config/timeouts';
import { test, expect } from '@ui/fixtures';
import { gotoRoute } from '@ui/support';

const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

const ROUTES = [
  { name: 'Events', path: '/events', readySelector: 'events-list-item' },
  { name: 'Gyms', path: '/gyms', readySelector: 'gyms-list-item' },
  { name: 'Competitions', path: '/competitions', readySelector: 'competitions-list-item' },
  { name: 'Stores', path: '/stores', readySelector: 'stores-list-item' },
  { name: 'About', path: '/about', readySelector: 'about-page' },
] as const;

type AxeResults = Awaited<ReturnType<AxeBuilder['analyze']>>;
type Violation = AxeResults['violations'][number];
type ViolatingNode = Violation['nodes'][number];

function diagnose(node: ViolatingNode): Record<string, unknown> {
  const checks = [...node.any, ...node.all];
  // axe types `data` as `any`; keep it opaque and let the diff render it.
  const data: unknown = checks.find(check => check.data)?.data;
  return {
    target: node.target.join(' '),
    why: checks.map(check => check.message).join('; '),
    ...(data === undefined || data === null ? {} : { data }),
  };
}

test.describe('Accessibility acceptance', { tag: ['@a11y', '@desktop'] }, () => {
  for (const { name, path, readySelector } of ROUTES) {
    test(
      `Given the ${name} page, when it is scanned against WCAG 2.1 A/AA, then no violations are reported`,
      { tag: '@acceptance' },
      async ({ page }) => {
        test.setTimeout(TIMEOUTS.max);
        const ready = page.getByTestId(readySelector).first();
        await gotoRoute(page, path, ready);
        await expect(ready).toBeVisible();

        const results = await new AxeBuilder({ page }).withTags([...WCAG_TAGS]).analyze();

        expect(
          results.violations.map(violation => ({
            id: violation.id,
            impact: violation.impact,
            help: violation.help,
            nodes: violation.nodes.map(diagnose),
          })),
        ).toEqual([]);
      },
    );
  }
});
