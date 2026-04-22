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
import { readCompetitionCard, type CompetitionCard } from './competition-card.screen';

export type CompetitionsScreen = Readonly<{
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
  readCard: (name: string) => Promise<CompetitionCard>;
  expectCardData: (name: string, expected: Partial<CompetitionCard>) => Promise<void>;
}>;

export function getCompetitionsLocators(page: Page) {
  const searchContainer = page.getByTestId('competitions-page-search');
  const items = page.getByTestId('competitions-list-item');

  return {
    header: page.getByTestId('competitions-page-header'),
    headerTitle: page.getByTestId('competitions-page-header-title'),
    searchContainer,
    searchInput: searchContainer.getByTestId('search-input'),
    clearSearchButton: searchContainer.getByTestId('search-clear-button'),
    emptyState: page.getByTestId('no-data-state'),
    emptyStateTitle: page.getByTestId('no-data-state-title'),
    emptyStateMessage1: page.getByTestId('no-data-state-message-line1'),
    emptyStateMessage2: page.getByTestId('no-data-state-message-line2'),
    items,
    cardByName: (name: string) =>
      items.filter({ has: page.getByTestId('competition-card-name').filter({ hasText: name }) }),
  };
}

export function createCompetitionsScreen(page: Page): CompetitionsScreen {
  const locators = getCompetitionsLocators(page);

  return {
    firstCard: locators.items.first(),
    navigate: () => navigateToRoute(page, '/competitions', { waitForFeatureFlags: true }),
    verifyIsLoaded: () => expectListShell(locators.header, locators.headerTitle, locators.searchContainer),
    searchFor: term => search(locators.searchInput, term),
    clearSearch: () => clearSearch(locators.searchInput, locators.clearSearchButton),
    expectSearchValue: term => expectSearchValue(locators.searchInput, term),
    expectHeaderVisible: () => expect(locators.header).toBeVisible(),
    async expectNoResults() {
      await expectEmptyState(locators.emptyState, locators.items);
      await expect(locators.emptyStateTitle).toHaveText('No Results Found');
      await expect(locators.emptyStateMessage1).toHaveText(
        'No competitions matched your search. Try different keywords.',
      );
      await expect(locators.emptyStateMessage2).toHaveText('Try adjusting your filters or check back later.');
    },
    expectAtLeastOneResult: () => expectAtLeastOneRow(locators.items),
    expectResultCount: count => expectResultCount(locators.items, count),
    async readCard(name: string) {
      const card = locators.cardByName(name);
      await expect(card).toBeVisible();
      return readCompetitionCard(card);
    },
    async expectCardData(name: string, expected: Partial<CompetitionCard>) {
      const actual = await this.readCard(name);
      expect(actual).toMatchObject(expected);
    },
  };
}
