import type { Page } from '@playwright/test';
import { createListView, type ListView, type ListViewIds } from '@lib/ui';

export const GYMS_IDS = {
  route: '/gyms',
  header: 'gyms-page-header',
  headerTitle: 'gyms-page-header-title',
  headerTotal: 'gyms-page-header-total',
  search: 'gyms-page-search',
  list: 'gyms-page-list',
  listItem: 'gyms-list-item',
  listEmpty: 'no-data-state',
  listError: 'error-state',
  countyFilterLabel: 'Select County',
} as const satisfies ListViewIds & { countyFilterLabel: string };

export type GymsPage = ListView & {
  filterByCounty: (label: string) => Promise<void>;
  resetCountyFilter: () => Promise<void>;
};

export function createGymsPage(page: Page): GymsPage {
  const base = createListView(page, GYMS_IDS);
  const select = page.getByLabel(GYMS_IDS.countyFilterLabel);

  return {
    ...base,
    async filterByCounty(label) {
      await select.selectOption({ label });
    },
    async resetCountyFilter() {
      await select.selectOption({ index: 0 });
    },
  };
}
