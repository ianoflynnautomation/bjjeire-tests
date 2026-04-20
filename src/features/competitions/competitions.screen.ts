import { expect, type Page } from '@playwright/test';
import { createListView, createScreenDriver, type ListView, type ListViewIds } from '@shared/ui';

export const COMPETITIONS_IDS = {
  route: '/competitions',
  header: 'competitions-page-header',
  headerTitle: 'competitions-page-header-title',
  headerTotal: 'competitions-page-header-total',
  search: 'competitions-page-search',
  list: 'competitions-page-list',
  listItem: 'competitions-list-item',
} as const satisfies ListViewIds;

export type CompetitionsScreen = ListView & {
  expectHeaderVisible: () => Promise<void>;
  expectNoResults: () => Promise<void>;
  expectAtLeastOneResult: () => Promise<void>;
};

export function createCompetitionsScreen(page: Page): CompetitionsScreen {
  const screen = createScreenDriver(page);
  const base = createListView(page, COMPETITIONS_IDS);
  const header = page.getByTestId(COMPETITIONS_IDS.header);

  return {
    ...base,

    async expectHeaderVisible() {
      await screen.assertions.expectElementVisible(header);
    },

    async expectNoResults() {
      await expect(base.items).toHaveCount(0);
    },

    async expectAtLeastOneResult() {
      await screen.assertions.expectElementVisible(base.items.first());
      expect(await base.items.count()).toBeGreaterThan(0);
    },
  };
}
