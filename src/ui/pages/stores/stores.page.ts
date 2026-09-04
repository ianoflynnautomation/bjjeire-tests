import { expect, type Locator, type Page } from '@playwright/test';
import { fillListSearch, gotoRoute, waitForRouteMounted, type TextMatcher } from '@ui/support';
import { cardByName } from '../common/card.page';
import { expectNoDataState } from '../common/empty.page';
import {
  expectNetworkError as expectNetworkErrorState,
  expectServerError as expectServerErrorState,
} from '../common/error.page';
import { getStoreCardData } from './stores.card.page';
import { NO_DATA_COPY, TEST_IDS } from './stores.constants';
import type { StoreCard } from './stores.types';

const header = (page: Page) => page.getByTestId(TEST_IDS.header);
const headerTitle = (page: Page) => page.getByTestId(TEST_IDS.headerTitle);
const searchContainer = (page: Page) => page.getByTestId(TEST_IDS.search);
const searchInput = (page: Page) => searchContainer(page).getByTestId(TEST_IDS.searchInput);
export const listItems = (page: Page) => page.getByTestId(TEST_IDS.listItem);
const emptyState = (page: Page) => page.getByTestId(TEST_IDS.emptyState);
const storeCard = (page: Page, name: string): Locator => cardByName(page, listItems(page), TEST_IDS.cardName, name);

export async function goTo(page: Page): Promise<void> {
  await gotoRoute(page, '/stores', header(page));
}

export async function verifyIsLoaded(page: Page): Promise<void> {
  await waitForRouteMounted(header(page));
  await expect(header(page)).toBeVisible();
  await expect(headerTitle(page)).toBeVisible();
  await expect(searchContainer(page)).toBeVisible();
}

export async function searchFor(page: Page, term: string): Promise<void> {
  await fillListSearch(page, searchInput(page), term);
}

export async function clearSearch(page: Page): Promise<void> {
  await fillListSearch(page, searchInput(page), '');
}

export async function expectResultCount(page: Page, count: number): Promise<void> {
  await expect(listItems(page)).toHaveCount(count);
}

export async function expectSearchValue(page: Page, term: TextMatcher): Promise<void> {
  await expect(searchInput(page)).toHaveValue(term);
}

export async function expectNoResults(page: Page): Promise<void> {
  await expect(emptyState(page)).toBeVisible();
  await expect(listItems(page)).toHaveCount(0);
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

export async function readCard(page: Page, name: string): Promise<StoreCard> {
  const card = storeCard(page, name);
  await expect(card).toBeVisible();
  return getStoreCardData(card);
}

export async function expectCardData(page: Page, expected: StoreCard): Promise<void> {
  const actual = await readCard(page, expected.name);
  expect(actual).toMatchObject(expected);
}
