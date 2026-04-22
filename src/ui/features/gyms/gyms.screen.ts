import { expect, type Locator, type Page } from '@playwright/test';
import {
  clearSearch,
  expectAtLeastOneRow,
  expectEmptyState,
  expectListShell,
  expectResultCount,
  expectSearchValue,
  navigateToRoute,
  search,
} from '@ui/support/ui';
import { readGymCard, type GymCard } from './gym-card.screen';

export type GymsScreen = Readonly<{
  firstCard: Locator;
  navigate: () => Promise<void>;
  verifyIsLoaded: () => Promise<void>;
  searchFor: (term: string) => Promise<void>;
  clearSearch: () => Promise<void>;
  expectSearchValue: (term: string) => Promise<void>;
  expectHeaderVisible: () => Promise<void>;
  expectNoResults: () => Promise<void>;
  expectAtLeastOneResult: () => Promise<void>;
  expectResultCount: (count: number) => Promise<void>;
  readCard: (name: string) => Promise<GymCard>;
  expectCardData: (name: string, expected: Partial<GymCard>) => Promise<void>;
}>;

export function getGymsLocators(page: Page) {
  const searchContainer = page.getByTestId('gyms-page-search');
  const items = page.getByTestId('gyms-list-item');

  return {
    header: page.getByTestId('gyms-page-header'),
    headerTitle: page.getByTestId('gyms-page-header-title'),
    searchContainer,
    searchInput: searchContainer.getByTestId('search-input'),
    clearSearchButton: searchContainer.getByTestId('search-clear-button'),
    items,
    emptyState: page.getByTestId('no-data-state'),
    cardByName: (name: string) => items.filter({ has: page.getByTestId('gym-card-name').filter({ hasText: name }) }),
  };
}

export function createGymsScreen(page: Page): GymsScreen {
  const locators = getGymsLocators(page);

  return {
    firstCard: locators.items.first(),
    navigate: () => navigateToRoute(page, '/gyms', { waitForFeatureFlags: true }),
    verifyIsLoaded: () => expectListShell(locators.header, locators.headerTitle, locators.searchContainer),
    searchFor: term => search(locators.searchInput, term),
    clearSearch: () => clearSearch(locators.searchInput, locators.clearSearchButton),
    expectSearchValue: term => expectSearchValue(locators.searchInput, term),
    expectHeaderVisible: () => expect(locators.header).toBeVisible(),
    expectNoResults: () => expectEmptyState(locators.emptyState, locators.items),
    expectAtLeastOneResult: () => expectAtLeastOneRow(locators.items),
    expectResultCount: count => expectResultCount(locators.items, count),
    async readCard(name: string) {
      const card = locators.cardByName(name);
      await expect(card).toBeVisible();
      return readGymCard(card);
    },
    async expectCardData(name: string, expected: Partial<GymCard>) {
      const actual = await this.readCard(name);
      expect(actual).toMatchObject(expected);
    },
  };
}
