import { expect, type Locator, type Page } from '@playwright/test';
import {
  clearListSearch,
  fillListSearch,
  LIST_API_URL,
  performAndWaitForApi,
  waitForListOrEmpty,
  type TextMatcher,
} from '@ui/support';
import { cardByName } from '../common/card.page';
import { expectNoDataState } from '../common/empty.page';
import {
  expectNetworkError as expectNetworkErrorState,
  expectServerError as expectServerErrorState,
} from '../common/error.page';
import { getEventCardData } from './events.card.page';
import { NO_DATA_COPY, TEST_IDS } from './events.constants';
import { type BjjEventCard } from './events.types';

const ALL_COUNTIES_OPTION = 'all';

const header = (page: Page) => page.getByTestId(TEST_IDS.header);
const headerTitle = (page: Page) => page.getByTestId(TEST_IDS.headerTitle);
const headerTotal = (page: Page) => page.getByTestId(TEST_IDS.headerTotal);
const searchContainer = (page: Page) => page.getByTestId(TEST_IDS.search);
const searchInput = (page: Page) => searchContainer(page).getByTestId(TEST_IDS.searchInput);
const filters = (page: Page) => page.getByTestId(TEST_IDS.filters);
const countySelect = (page: Page) => filters(page).getByTestId(TEST_IDS.countySelect);
const typeFilterButton = (page: Page, label: string) => filters(page).getByRole('button', { name: label, exact: true });
export const listItems = (page: Page) => page.getByTestId(TEST_IDS.listItem);
const emptyState = (page: Page) => page.getByTestId(TEST_IDS.emptyState);
const eventCard = (page: Page, name: string): Locator => cardByName(page, listItems(page), TEST_IDS.cardName, name);

export async function goTo(page: Page): Promise<void> {
  await page.goto('/events');
}

export async function verifyIsLoaded(page: Page): Promise<void> {
  await expect(header(page)).toBeVisible();
  await expect(headerTitle(page)).toBeVisible();
  await expect(searchContainer(page)).toBeVisible();
}

export async function searchFor(page: Page, term: string): Promise<void> {
  await fillListSearch(page, searchInput(page), term);
}

export async function clearSearch(page: Page): Promise<void> {
  await clearListSearch(page, searchInput(page));
}

export async function expectSearchValue(page: Page, term: TextMatcher): Promise<void> {
  await expect(searchInput(page)).toHaveValue(term);
}

export async function filterByCounty(page: Page, county: string): Promise<void> {
  await waitForListOrEmpty(listItems(page), emptyState(page));
  await performAndWaitForApi(page, LIST_API_URL.events, () => countySelect(page).selectOption(county), { county });
}

export async function resetCountyFilter(page: Page): Promise<void> {
  await waitForListOrEmpty(listItems(page), emptyState(page));
  await performAndWaitForApi(page, LIST_API_URL.events, () => countySelect(page).selectOption(ALL_COUNTIES_OPTION), {
    county: null,
  });
}

export async function filterByType(page: Page, typeLabel: string): Promise<void> {
  await waitForListOrEmpty(listItems(page), emptyState(page));
  await performAndWaitForApi(page, LIST_API_URL.events, () => typeFilterButton(page, typeLabel).click());
}

export async function expectTitle(page: Page, title: string): Promise<void> {
  await expect(headerTitle(page)).toHaveText(title);
}

export async function expectHeaderTotal(page: Page, total: TextMatcher): Promise<void> {
  await expect(headerTotal(page)).toHaveText(total);
}

export async function expectNoResults(page: Page): Promise<void> {
  await expect(emptyState(page)).toBeVisible();
  await expect(listItems(page)).toHaveCount(0);
}

export async function expectResultCount(page: Page, count: number): Promise<void> {
  await expect(listItems(page)).toHaveCount(count);
}

export async function expectEmptyStateMessage(page: Page): Promise<void> {
  await expectNoDataState(page, NO_DATA_COPY);
}

export async function expectNetworkErrorMessage(page: Page): Promise<void> {
  await expectNetworkErrorState(page);
}

export async function expectServerErrorMessage(page: Page): Promise<void> {
  await expectServerErrorState(page);
}

export async function readCard(page: Page, name: string): Promise<BjjEventCard> {
  const card = eventCard(page, name);
  await expect(card).toBeVisible();
  return getEventCardData(card);
}

export async function expectCardData(
  page: Page,
  expected: Pick<BjjEventCard, 'name'> & Partial<BjjEventCard>,
): Promise<void> {
  const actual = await readCard(page, expected.name);
  expect(actual).toMatchObject(expected);
}

export async function expectCardAbsent(page: Page, name: string): Promise<void> {
  await expect(eventCard(page, name)).toHaveCount(0);
}
