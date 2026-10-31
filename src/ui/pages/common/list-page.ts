import { expect, type Locator, type Page } from '@playwright/test';
import {
  clearListSearch,
  expectAllCardsMatch,
  fillListSearch,
  gotoRoute,
  waitForListOrEmpty,
  waitForRouteMounted,
  type TextMatcher,
} from '@ui/support';
import { cardByName } from './card.page';
import { expectNoDataState, type NoDataCopy } from './empty.page';
import { expectNetworkError, expectNoError, expectServerError, retryAfterError } from './error.page';
import { expectPageIndicator, goToNextListPage } from './pagination.page';

const SEARCH_CLEAR_BUTTON_TEST_ID = 'search-clear-button';

export type ListPageTestIds = Readonly<{
  header: string;
  headerTitle: string;
  search: string;
  searchInput: string;
  listItem: string;
  emptyState: string;
  cardName: string;
}>;

export type ListPageConfig = Readonly<{
  route: string;
  testIds: ListPageTestIds;
  noDataCopy: NoDataCopy;
}>;

export abstract class ListPage<TCard extends { name: string }> {
  constructor(
    protected readonly page: Page,
    private readonly config: ListPageConfig,
  ) {}

  protected abstract readCardData(card: Locator): Promise<TCard>;

  protected get ids(): ListPageTestIds {
    return this.config.testIds;
  }

  get listItems(): Locator {
    return this.page.getByTestId(this.ids.listItem);
  }

  get header(): Locator {
    return this.page.getByTestId(this.ids.header);
  }

  protected get headerTitle(): Locator {
    return this.page.getByTestId(this.ids.headerTitle);
  }

  protected get searchInput(): Locator {
    return this.page.getByTestId(this.ids.search).getByTestId(this.ids.searchInput);
  }

  get emptyState(): Locator {
    return this.page.getByTestId(this.ids.emptyState);
  }

  protected card(name: string): Locator {
    return cardByName(this.page, this.listItems, this.ids.cardName, name);
  }

  async goTo(): Promise<void> {
    await gotoRoute(this.page, this.config.route, this.header);
  }

  async goToWithQuery(query: string): Promise<void> {
    await gotoRoute(this.page, `${this.config.route}?${query}`, this.header);
  }

  async reload(): Promise<void> {
    await this.page.reload();
    await waitForRouteMounted(this.header);
  }

  async goBack(): Promise<void> {
    await this.page.goBack();
    await waitForRouteMounted(this.header);
  }

  async goToNextPage(): Promise<void> {
    await goToNextListPage(this.page);
  }

  async expectOnPage(currentPage: number, totalPages: number): Promise<void> {
    await expectPageIndicator(this.page, currentPage, totalPages);
  }

  async verifyIsLoaded(): Promise<void> {
    await waitForRouteMounted(this.header);
    await expect(this.header).toBeVisible();
    await expect(this.headerTitle).toBeVisible();
    await expect(this.page.getByTestId(this.ids.search)).toBeVisible();
  }

  async searchFor(term: string): Promise<void> {
    await fillListSearch(this.page, this.searchInput, term);
  }

  async clearSearch(): Promise<void> {
    await clearListSearch(this.page, this.searchInput);
  }

  async clearSearchWithButton(): Promise<void> {
    await this.page.getByTestId(this.ids.search).getByTestId(SEARCH_CLEAR_BUTTON_TEST_ID).click();
  }

  async expectSearchFocused(): Promise<void> {
    await expect(this.searchInput).toBeFocused();
  }

  async expectSearchValue(term: TextMatcher): Promise<void> {
    await expect(this.searchInput).toHaveValue(term);
  }

  async expectResultCount(count: number): Promise<void> {
    await expect(this.listItems).toHaveCount(count);
  }

  async expectTitle(title: string): Promise<void> {
    await expect(this.headerTitle).toHaveText(title);
  }

  async expectNoResults(): Promise<void> {
    await expect(this.emptyState).toBeVisible();
    await expect(this.listItems).toHaveCount(0);
  }

  async expectEmptyStateMessage(): Promise<void> {
    await expectNoDataState(this.page, this.config.noDataCopy);
  }

  async expectListNotEmpty(): Promise<void> {
    await expectNoError(this.page);
    await expect(this.listItems).not.toHaveCount(0);
  }

  async expectCardAbsent(name: string): Promise<void> {
    await expect(this.card(name)).toHaveCount(0);
  }

  async readCard(name: string): Promise<TCard> {
    const card = this.card(name);
    await expect(card).toBeVisible();
    return this.readCardData(card);
  }

  async expectCardData(expected: Pick<TCard, 'name'> & Partial<TCard>): Promise<void> {
    const actual = await this.readCard(expected.name);
    expect(actual).toMatchObject(expected);
  }

  async expectNetworkErrorMessage(): Promise<void> {
    await expectNetworkError(this.page);
  }

  async expectServerErrorMessage(): Promise<void> {
    await expectServerError(this.page);
  }

  async retryAfterError(): Promise<void> {
    await retryAfterError(this.page);
  }

  protected async expectAllCardsMatchField(cardFieldTestId: string, value: string): Promise<void> {
    await expectAllCardsMatch(this.listItems, this.emptyState, cardFieldTestId, value);
  }

  protected async selectFilter(select: Locator, value: string): Promise<void> {
    await waitForListOrEmpty(this.listItems, this.emptyState);
    await select.selectOption(value);
    await expect(select).toHaveValue(value);
  }

  protected async resetFilter(select: Locator, allValue: string): Promise<void> {
    await waitForListOrEmpty(this.listItems, this.emptyState);
    await select.selectOption(allValue);
    await expect(select).toHaveValue(allValue);
    await waitForListOrEmpty(this.listItems, this.emptyState);
  }
}
