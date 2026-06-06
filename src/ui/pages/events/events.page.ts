import { expect, type Page } from '@playwright/test';
import {
  expectToHaveCount,
  expectToHaveText,
  expectVisible,
  getLocatorByTestId,
  goToPage,
  type TextMatcher,
} from '@ui/support';
import { cardByName } from '../common/card.page';
import { expectEmptyList, expectList } from '../common/list.page';
import {
  clearSearch as clearSearchInput,
  expectSearchValue as expectSearchInputValue,
  searchFor as searchForInput,
} from '../common/search.page';
import { getEventCardData } from './events.card.page';
import { TEST_IDS } from './events.constants';
import { type BjjEventCard } from './events.types';

const header = (page: Page) => getLocatorByTestId(page, TEST_IDS.header);
const headerTitle = (page: Page) => getLocatorByTestId(page, TEST_IDS.headerTitle);
const searchContainer = (page: Page) => getLocatorByTestId(page, TEST_IDS.search);
const searchInput = (page: Page) => searchContainer(page).getByTestId(TEST_IDS.searchInput);
const listItems = (page: Page) => getLocatorByTestId(page, TEST_IDS.listItem);
const emptyState = (page: Page) => getLocatorByTestId(page, TEST_IDS.emptyState);
const eventCard = (page: Page, name: string) => cardByName(page, listItems(page), TEST_IDS.cardName, name);

export async function navigate(page: Page): Promise<void> {
  await goToPage(page, '/events');
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

export async function expectTitle(page: Page, title: string): Promise<void> {
  await expectToHaveText(headerTitle(page), title);
}

export async function expectNoResults(page: Page): Promise<void> {
  await expectEmptyList(emptyState(page), listItems(page));
}

export async function expectResultCount(page: Page, count: number): Promise<void> {
  await expectToHaveCount(listItems(page), count);
}

export async function readCard(page: Page, name: string): Promise<BjjEventCard> {
  const card = eventCard(page, name);
  await expectVisible(card);
  return getEventCardData(card);
}

export async function expectCardData(page: Page, name: string, expected: Partial<BjjEventCard>): Promise<void> {
  const actual = await readCard(page, name);
  expect(actual).toMatchObject(expected);
}
