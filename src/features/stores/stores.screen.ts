import { expect, type Page } from '@playwright/test';
import { createListView, createScreenDriver, type ListView, type ListViewIds } from '@shared/ui';

export const STORES_IDS = {
  route: '/stores',
  header: 'stores-page-header',
  headerTitle: 'stores-page-header-title',
  headerTotal: 'stores-page-header-total',
  search: 'stores-page-search',
  list: 'stores-page-list',
  listItem: 'stores-list-item',
} as const satisfies ListViewIds;

export type StoresScreen = ListView & {
  expectHeaderVisible: () => Promise<void>;
  expectNoResults: () => Promise<void>;
  expectAtLeastOneResult: () => Promise<void>;
};

export function createStoresScreen(page: Page): StoresScreen {
  const screen = createScreenDriver(page);
  const base = createListView(page, STORES_IDS);
  const header = page.getByTestId(STORES_IDS.header);

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
