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
  getLocatorByTestId,
  getPage,
  navigateToRoute,
  search as fillSearchInput,
  stabilizeForSnapshot,
  type ListPageRegion,
  type ListPageRegions,
  type ScreenshotOptions,
  type TextMatcher,
} from '@ui/support/ui';
import { readCompetitionCard, type CompetitionCard } from './competition-card.page';

const ROUTE = '/competitions';

const TEST_IDS = {
  cardName: 'competition-card-name',
  clearSearchButton: 'search-clear-button',
  emptyState: 'no-data-state',
  emptyStateMessageLine1: 'no-data-state-message-line1',
  emptyStateMessageLine2: 'no-data-state-message-line2',
  emptyStateTitle: 'no-data-state-title',
  header: 'competitions-page-header',
  headerTitle: 'competitions-page-header-title',
  list: 'competitions-list',
  listItem: 'competitions-list-item',
  search: 'competitions-page-search',
  searchInput: 'search-input',
} as const;

const EMPTY_STATE = {
  title: 'No Results Found',
  messageLine1: 'No competitions matched your search. Try different keywords.',
  messageLine2: 'Try adjusting your filters or check back later.',
} as const;

const header = () => getLocatorByTestId(TEST_IDS.header);
const headerTitle = () => getLocatorByTestId(TEST_IDS.headerTitle);
const searchContainer = () => getLocatorByTestId(TEST_IDS.search);
const searchInput = () => searchContainer().getByTestId(TEST_IDS.searchInput);
const clearSearchButton = () => searchContainer().getByTestId(TEST_IDS.clearSearchButton);
const list = () => getLocatorByTestId(TEST_IDS.list);
const listItems = () => getLocatorByTestId(TEST_IDS.listItem);
const emptyState = () => getLocatorByTestId(TEST_IDS.emptyState);
const emptyStateTitle = () => getLocatorByTestId(TEST_IDS.emptyStateTitle);
const emptyStateMessage1 = () => getLocatorByTestId(TEST_IDS.emptyStateMessageLine1);
const emptyStateMessage2 = () => getLocatorByTestId(TEST_IDS.emptyStateMessageLine2);
const competitionCard = (name: string) => cardByName(getPage(), listItems(), TEST_IDS.cardName, name);

function snapshotRegion(region: ListPageRegion): Locator {
  const regions: ListPageRegions = {
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
  await expect(emptyStateTitle()).toHaveText(EMPTY_STATE.title);
  await expect(emptyStateMessage1()).toHaveText(EMPTY_STATE.messageLine1);
  await expect(emptyStateMessage2()).toHaveText(EMPTY_STATE.messageLine2);
}

export async function expectAtLeastOneResult(): Promise<void> {
  await expectAtLeastOneRow(listItems());
}

export async function expectResultCount(count: number): Promise<void> {
  await expectRowCount(listItems(), count);
}

export async function readCard(name: string): Promise<CompetitionCard> {
  const card = competitionCard(name);
  await expect(card).toBeVisible();
  return readCompetitionCard(card);
}

export async function expectCardData(name: string, expected: Partial<CompetitionCard>): Promise<void> {
  const actual = await readCard(name);
  expectObjectSubset(actual, expected, 'competition card');
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
