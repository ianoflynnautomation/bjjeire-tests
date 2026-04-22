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
import { readEventCard, type BjjEventCard } from './event-card.screen';

export type EventsScreen = Readonly<{
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
  readCard: (name: string) => Promise<BjjEventCard>;
  expectCardData: (name: string, expected: BjjEventCard) => Promise<void>;
}>;

export function getEventsLocators(page: Page) {
  const searchContainer = page.getByTestId('events-page-search');
  const items = page.getByTestId('events-list-item');

  return {
    header: page.getByTestId('events-page-header'),
    headerTitle: page.getByTestId('events-page-header'),
    searchContainer,
    searchInput: searchContainer.getByTestId('search-input'),
    clearSearchButton: searchContainer.getByTestId('search-clear-button'),
    items,
    emptyState: page.getByTestId('no-data-state'),
    cardByName: (name: string) => items.filter({ has: page.getByTestId('events-card-name').filter({ hasText: name }) }),
  };
}

export function createEventsScreen(page: Page): EventsScreen {
  const locators = getEventsLocators(page);

  return {
    firstCard: locators.items.first(),
    navigate: () => navigateToRoute(page, '/events', { waitForFeatureFlags: true }),
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
      return readEventCard(card);
    },
    async expectCardData(name: string, expected: BjjEventCard) {
      const actual = await this.readCard(name);
      expect(actual).toMatchObject(expected);
    },
  };
}
