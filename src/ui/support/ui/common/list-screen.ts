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
} from '.';

export type ListScreenTestIds = Readonly<{
  header: string;
  headerTitle: string;
  searchContainer: string;
  listItem: string;
  cardName: string;
  emptyState?: string;
}>;

export type ListScreenConfig<TCard extends object> = Readonly<{
  route: string;
  testIds: ListScreenTestIds;
  readCard: (root: Locator) => Promise<TCard>;
}>;

export type ListScreen<TCard extends object> = Readonly<{
  firstCard: Locator;
  navigate: () => Promise<void>;
  verifyIsLoaded: () => Promise<void>;
  searchFor: (term: string) => Promise<void>;
  clearSearch: () => Promise<void>;
  expectSearchValue: (term: RegExp | string) => Promise<void>;
  expectHeaderVisible: () => Promise<void>;
  expectNoResults: () => Promise<void>;
  expectAtLeastOneResult: () => Promise<void>;
  expectResultCount: (count: number) => Promise<void>;
  readCard: (name: string) => Promise<TCard>;
  expectCardData: (name: string, expected: Partial<TCard>) => Promise<void>;
}>;

export function listScreenTestIds(plural: string, singular: string): ListScreenTestIds {
  return {
    header: `${plural}-page-header`,
    headerTitle: `${plural}-page-header-title`,
    searchContainer: `${plural}-page-search`,
    listItem: `${plural}-list-item`,
    cardName: `${singular}-card-name`,
  };
}

export function createListScreen<TCard extends object>(page: Page, config: ListScreenConfig<TCard>): ListScreen<TCard> {
  const { testIds, route, readCard } = config;
  const searchContainer = page.getByTestId(testIds.searchContainer);
  const items = page.getByTestId(testIds.listItem);
  const header = page.getByTestId(testIds.header);
  const headerTitle = page.getByTestId(testIds.headerTitle);
  const searchInput = searchContainer.getByTestId('search-input');
  const clearSearchButton = searchContainer.getByTestId('search-clear-button');
  const emptyState = page.getByTestId(testIds.emptyState ?? 'no-data-state');
  const cardByName = (name: string): Locator =>
    items.filter({ has: page.getByTestId(testIds.cardName).filter({ hasText: name }) });

  return {
    firstCard: items.first(),
    navigate: () => navigateToRoute(page, route),
    verifyIsLoaded: () => expectListShell(header, headerTitle, searchContainer),
    searchFor: term => search(searchInput, term),
    clearSearch: () => clearSearch(searchInput, clearSearchButton),
    expectSearchValue: term => expectSearchValue(searchInput, term),
    expectHeaderVisible: () => expect(header).toBeVisible(),
    expectNoResults: () => expectEmptyState(emptyState, items),
    expectAtLeastOneResult: () => expectAtLeastOneRow(items),
    expectResultCount: count => expectResultCount(items, count),
    async readCard(name: string) {
      const card = cardByName(name);
      await expect(card).toBeVisible();
      return readCard(card);
    },
    async expectCardData(name: string, expected: Partial<TCard>) {
      const card = cardByName(name);
      await expect(card).toBeVisible();
      const actual = (await readCard(card)) as Record<string, unknown>;
      expect(actual).toMatchObject(expected as Record<string, unknown>);
    },
  };
}
