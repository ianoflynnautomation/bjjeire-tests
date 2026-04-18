import type { Page } from '@playwright/test';
import { createListView, type ListView, type ListViewIds } from '@lib/ui';

export const EVENTS_IDS = {
  route: '/events',
  header: 'events-page-header',
  headerTitle: 'events-page-header-title',
  headerTotal: 'events-page-header-total',
  search: 'events-page-search',
  list: 'events-page-list',
  listItem: 'events-list-item',
} as const satisfies ListViewIds;

export type EventsPage = ListView;

export function createEventsPage(page: Page): EventsPage {
  return createListView(page, EVENTS_IDS);
}
