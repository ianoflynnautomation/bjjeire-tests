import { expect, type Locator, type Page } from '@playwright/test';
import type { TextMatcher } from '@ui/support';
import { cardByName } from '../common/card.page';
import { getStoreCardData, type StoreCard } from './stores.card.page';
import { TEST_IDS } from './stores.constants';

const header = (page: Page) => page.getByTestId(TEST_IDS.header);
const headerTitle = (page: Page) => page.getByTestId(TEST_IDS.headerTitle);
const searchContainer = (page: Page) => page.getByTestId(TEST_IDS.search);
const searchInput = (page: Page) => searchContainer(page).getByTestId(TEST_IDS.searchInput);
const listItems = (page: Page) => page.getByTestId(TEST_IDS.listItem);
const emptyState = (page: Page) => page.getByTestId(TEST_IDS.emptyState);
const storeCard = (page: Page, name: string): Locator => cardByName(page, listItems(page), TEST_IDS.cardName, name);

export async function goTo(page: Page): Promise<void> {
  await page.goto('/stores');
}

export async function verifyIsLoaded(page: Page): Promise<void> {
  await expect(header(page)).toBeVisible();
  await expect(headerTitle(page)).toBeVisible();
  await expect(searchContainer(page)).toBeVisible();
}

export async function searchFor(page: Page, term: string): Promise<void> {
  const input = searchInput(page);
  await input.clear();
  await input.fill(term);
}

export async function clearSearch(page: Page): Promise<void> {
  await searchInput(page).clear();
}

export async function expectSearchValue(page: Page, term: TextMatcher): Promise<void> {
  await expect(searchInput(page)).toHaveValue(term);
}

export async function expectNoResults(page: Page): Promise<void> {
  await expect(emptyState(page)).toBeVisible();
  await expect(listItems(page)).toHaveCount(0);
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
