import type { Page } from '@playwright/test';
import { createListView, type ListView, type ListViewIds } from '@lib/ui';

export const STORES_IDS = {
  route: '/stores',
  header: 'stores-page-header',
  headerTitle: 'stores-page-header-title',
  headerTotal: 'stores-page-header-total',
  search: 'stores-page-search',
  list: 'stores-page-list',
  listItem: 'stores-list-item',
} as const satisfies ListViewIds;

export type StoresPage = ListView;

export function createStoresPage(page: Page): StoresPage {
  return createListView(page, STORES_IDS);
}
