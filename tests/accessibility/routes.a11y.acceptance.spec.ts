import { AxeBuilder } from '@axe-core/playwright';
import { expect } from '@playwright/test';
import { test } from '@ui/fixtures';

const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

const ROUTES = [
  { name: 'Events', path: '/events', readySelector: 'events-list-item' },
  { name: 'Gyms', path: '/gyms', readySelector: 'gyms-list-item' },
  { name: 'Competitions', path: '/competitions', readySelector: 'competitions-list-item' },
  { name: 'Stores', path: '/stores', readySelector: 'stores-list-item' },
  { name: 'About', path: '/about', readySelector: 'about-page' },
] as const;

test.describe('Accessibility acceptance', { tag: ['@a11y', '@desktop'] }, () => {
  for (const { name, path, readySelector } of ROUTES) {
    test(
      `Given the ${name} page, when it is scanned against WCAG 2.1 A/AA, then no violations are reported`,
      { tag: '@acceptance' },
      async ({ page }) => {
        await page.goto(path);
        await expect(page.getByTestId(readySelector).first()).toBeVisible();

        const results = await new AxeBuilder({ page }).withTags([...WCAG_TAGS]).analyze();

        expect(
          results.violations.map(violation => ({
            id: violation.id,
            impact: violation.impact,
            help: violation.help,
            nodes: violation.nodes.map(node => node.target.join(' ')),
          })),
        ).toEqual([]);
      },
    );
  }
});
