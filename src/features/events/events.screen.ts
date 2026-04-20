import { expect, type Page } from '@playwright/test';
import { createListView, createScreenDriver, type ListView, type ListViewIds } from '@shared/ui';

export const EVENTS_IDS = {
  route: '/events',
  header: 'events-page-header',
  headerTitle: 'events-page-header-title',
  headerTotal: 'events-page-header-total',
  search: 'events-page-search',
  list: 'events-page-list',
  listItem: 'events-list-item',
} as const satisfies ListViewIds;

export type EventsScreen = ListView & {
  expectHeaderVisible: () => Promise<void>;
  expectNoResults: () => Promise<void>;
  expectAtLeastOneResult: () => Promise<void>;
};

export function createEventsScreen(page: Page): EventsScreen {
  const screen = createScreenDriver(page);
  const base = createListView(page, EVENTS_IDS);
  const header = page.getByTestId(EVENTS_IDS.header);

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
