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
import { readStoreCard, type StoreCard } from './store-card.screen';

export type StoresScreen = Readonly<{
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
  readCard: (name: string) => Promise<StoreCard>;
  expectCardData: (name: string, expected: Partial<StoreCard>) => Promise<void>;
}>;

export function getStoresLocators(page: Page) {
  const searchContainer = page.getByTestId('stores-page-search');
  const items = page.getByTestId('stores-list-item');

  return {
    header: page.getByTestId('stores-page-header'),
    headerTitle: page.getByTestId('stores-page-header'),
    searchContainer,
    searchInput: searchContainer.getByTestId('search-input'),
    clearSearchButton: searchContainer.getByTestId('search-clear-button'),
    items,
    emptyState: page.getByTestId('no-data-state'),
    cardByName: (name: string) => items.filter({ has: page.getByTestId('stores-card-name').filter({ hasText: name }) }),
  };
}

export function createStoresScreen(page: Page): StoresScreen {
  const locators = getStoresLocators(page);

  return {
    firstCard: locators.items.first(),
    navigate: () => navigateToRoute(page, '/stores', { waitForFeatureFlags: true }),
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
      return readStoreCard(card);
    },
    async expectCardData(name: string, expected: Partial<StoreCard>) {
      const actual = await this.readCard(name);
      expect(actual).toMatchObject(expected);
    },
  };
}
