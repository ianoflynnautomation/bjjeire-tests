import { expect, type Page } from '@playwright/test';
import { createListView, createScreenDriver, type ListView, type ListViewIds } from '@shared/ui';
import { createGymCards, GYM_CARD_IDS, type GymCards } from './gym-card.screen';

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

export type GymsScreen = ListView & {
  readonly cards: GymCards;
  filterByCounty: (label: string) => Promise<void>;
  resetCountyFilter: () => Promise<void>;
  expectHeaderVisible: () => Promise<void>;
  expectNoResults: () => Promise<void>;
  expectAtLeastOneResult: () => Promise<void>;
  expectCardWithName: (name: string) => Promise<void>;
  expectAllCardsInCounty: (county: string) => Promise<void>;
};

export function createGymsScreen(page: Page): GymsScreen {
  const screen = createScreenDriver(page);
  const base = createListView(page, GYMS_IDS);
  const cards = createGymCards(page, GYMS_IDS.listItem);
  const select = page.getByLabel(GYMS_IDS.countyFilterLabel);
  const header = page.getByTestId(GYMS_IDS.header);
  const emptyState = page.getByTestId(GYMS_IDS.listEmpty);

  return {
    ...base,
    cards,

    async filterByCounty(label) {
      await screen.actions.selectByLabel(select, label);
    },

    async resetCountyFilter() {
      await screen.actions.selectByIndex(select, 0);
    },

    async expectHeaderVisible() {
      await screen.assertions.expectElementVisible(header);
    },

    async expectNoResults() {
      await screen.assertions.expectElementVisible(emptyState);
    },

    async expectAtLeastOneResult() {
      await screen.assertions.expectElementVisible(base.items.first());
      expect(await base.items.count()).toBeGreaterThan(0);
    },

    async expectCardWithName(name) {
      const card = cards.byName(name);
      await screen.assertions.expectElementVisible(card.root);
      await screen.assertions.expectToHaveText(card.root.getByTestId(GYM_CARD_IDS.name), name);
    },

    async expectAllCardsInCounty(county) {
      const counties = await cards.readAllCounties();
      expect(counties, `expected every gym card to be in county '${county}'`).not.toHaveLength(0);
      for (const value of counties) {
        expect(value.toLowerCase()).toContain(county.toLowerCase());
      }
    },
  };
}
