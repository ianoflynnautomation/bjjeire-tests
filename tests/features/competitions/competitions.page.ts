import type { Page } from '@playwright/test';
import { createListView, type ListView, type ListViewIds } from '@lib/ui';

export const COMPETITIONS_IDS = {
  route: '/competitions',
  header: 'competitions-page-header',
  headerTitle: 'competitions-page-header-title',
  headerTotal: 'competitions-page-header-total',
  search: 'competitions-page-search',
  list: 'competitions-page-list',
  listItem: 'competitions-list-item',
} as const satisfies ListViewIds;

export type CompetitionsPage = ListView;

export function createCompetitionsPage(page: Page): CompetitionsPage {
  return createListView(page, COMPETITIONS_IDS);
}
