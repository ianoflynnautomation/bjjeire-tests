import { expect, type Page } from '@playwright/test';
import { expectVisible, getLocatorByTestId, goToPage, type TextMatcher } from '@ui/support';
import { cardByName } from '../common/card.page';
import { expectEmptyList, expectList } from '../common/list.page';
import {
  clearSearch as clearSearchInput,
  expectSearchValue as expectSearchInputValue,
  searchFor as searchForInput,
} from '../common/search.page';
import { getStoreCardData, type StoreCard } from './stores.card.page';
import { TEST_IDS } from './stores.constants';

const header = (page: Page) => getLocatorByTestId(page, TEST_IDS.header);
const headerTitle = (page: Page) => getLocatorByTestId(page, TEST_IDS.headerTitle);
const searchContainer = (page: Page) => getLocatorByTestId(page, TEST_IDS.search);
const searchInput = (page: Page) => searchContainer(page).getByTestId(TEST_IDS.searchInput);
const listItems = (page: Page) => getLocatorByTestId(page, TEST_IDS.listItem);
const emptyState = (page: Page) => getLocatorByTestId(page, TEST_IDS.emptyState);
const storeCard = (page: Page, name: string) => cardByName(page, listItems(page), TEST_IDS.cardName, name);

export async function navigate(page: Page): Promise<void> {
  await goToPage(page, '/stores');
}

export async function verifyIsLoaded(page: Page): Promise<void> {
  await expectList(header(page), headerTitle(page), searchContainer(page));
}

export async function searchFor(page: Page, term: string): Promise<void> {
  await searchForInput(searchInput(page), term);
}

export async function clearSearch(page: Page): Promise<void> {
  await clearSearchInput(searchInput(page));
}

export async function expectSearchValue(page: Page, term: TextMatcher): Promise<void> {
  await expectSearchInputValue(searchInput(page), term);
}

export async function expectNoResults(page: Page): Promise<void> {
  await expectEmptyList(emptyState(page), listItems(page));
}

export async function readCard(page: Page, name: string): Promise<StoreCard> {
  const card = storeCard(page, name);
  await expectVisible(card);
  return getStoreCardData(card);
}

export async function expectCardData(page: Page, name: string, expected: Partial<StoreCard>): Promise<void> {
  const actual = await readCard(page, name);
  expect(actual).toMatchObject(expected);
}
