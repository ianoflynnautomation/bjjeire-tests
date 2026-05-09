import { expect, type Locator } from '@playwright/test';
import {
  cardByName,
  clearSearch as clearSearchInput,
  expectAtLeastOneRow,
  expectEmptyState,
  expectListShell,
  expectObjectSubset,
  expectResultCount as expectRowCount,
  expectSearchValue as expectInputValue,
  expectTitle as expectLocatorTitle,
  getPage,
  navigateToRoute,
  search as fillSearchInput,
  stabilizeForSnapshot,
  type ListPageRegion,
  type ScreenshotOptions,
  type TextMatcher,
} from '@ui/support/ui';
import { readStoreCard, type StoreCard } from './store-card.page';

const ROUTE = '/stores';

const TEST_IDS = {
  cardName: 'store-card-name',
  clearSearchButton: 'search-clear-button',
  emptyState: 'no-data-state',
  header: 'stores-page-header',
  headerTitle: 'stores-page-header-title',
  list: 'stores-list',
  listItem: 'stores-list-item',
  search: 'stores-page-search',
  searchInput: 'search-input',
} as const;

const header = () => getPage().getByTestId(TEST_IDS.header);
const headerTitle = () => getPage().getByTestId(TEST_IDS.headerTitle);
const searchContainer = () => getPage().getByTestId(TEST_IDS.search);
const searchInput = () => searchContainer().getByTestId(TEST_IDS.searchInput);
const clearSearchButton = () => searchContainer().getByTestId(TEST_IDS.clearSearchButton);
const list = () => getPage().getByTestId(TEST_IDS.list);
const listItems = () => getPage().getByTestId(TEST_IDS.listItem);
const emptyState = () => getPage().getByTestId(TEST_IDS.emptyState);
const storeCard = (name: string) => cardByName(getPage(), listItems(), TEST_IDS.cardName, name);

function snapshotRegion(region: ListPageRegion): Locator {
  const regions: Record<ListPageRegion, Locator> = {
    emptyState: emptyState(),
    header: header(),
    list: list(),
  };

  return regions[region];
}

export function firstCard(): Locator {
  return listItems().first();
}

export async function navigate(): Promise<void> {
  await navigateToRoute(getPage(), ROUTE);
}

export async function verifyIsLoaded(): Promise<void> {
  await expectListShell(header(), headerTitle(), searchContainer());
}

export async function searchFor(term: string): Promise<void> {
  await fillSearchInput(searchInput(), term);
}

export async function clearSearch(): Promise<void> {
  await clearSearchInput(searchInput(), clearSearchButton());
}

export async function expectSearchValue(term: TextMatcher): Promise<void> {
  await expectInputValue(searchInput(), term);
}

export async function expectTitle(title: string): Promise<void> {
  await expectLocatorTitle(headerTitle(), title);
}

export async function expectHeaderVisible(): Promise<void> {
  await expect(header()).toBeVisible();
}

export async function expectNoResults(): Promise<void> {
  await expectEmptyState(emptyState(), listItems());
}

export async function expectAtLeastOneResult(): Promise<void> {
  await expectAtLeastOneRow(listItems());
}

export async function expectResultCount(count: number): Promise<void> {
  await expectRowCount(listItems(), count);
}

export async function readCard(name: string): Promise<StoreCard> {
  const card = storeCard(name);
  await expect(card).toBeVisible();
  return readStoreCard(card);
}

export async function expectCardData(name: string, expected: Partial<StoreCard>): Promise<void> {
  const actual = await readCard(name);
  expectObjectSubset(actual, expected, 'store card');
}

export async function stabilize(): Promise<void> {
  await stabilizeForSnapshot(getPage());
}

export async function expectScreenshot(name: string, options: ScreenshotOptions = {}): Promise<void> {
  const page = getPage();
  await stabilizeForSnapshot(page);
  const target = options.region ? snapshotRegion(options.region) : page;
  await expect(target).toHaveScreenshot(name, options.mask ? { mask: [...options.mask] } : undefined);
}

export async function expectAriaTree(region: ListPageRegion, name: string): Promise<void> {
  await expect(snapshotRegion(region)).toMatchAriaSnapshot({ name });
}
