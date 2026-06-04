import { expect } from '@playwright/test';
import { expectVisible, getLocatorByTestId, getPage, goToPage, type TextMatcher } from '@ui/support';
import { cardByName } from '../common/card.page';
import { expectEmptyList, expectList } from '../common/list.page';
import {
  clearSearch as clearSearchInput,
  expectSearchValue as expectSearchInputValue,
  searchFor as searchForInput,
} from '../common/search.page';
import { getStoreCardData, type StoreCard } from './stores.card.page';
import { TEST_IDS } from './stores.constants';

const header = () => getLocatorByTestId(TEST_IDS.header);
const headerTitle = () => getLocatorByTestId(TEST_IDS.headerTitle);
const searchContainer = () => getLocatorByTestId(TEST_IDS.search);
const searchInput = () => searchContainer().getByTestId(TEST_IDS.searchInput);
const listItems = () => getLocatorByTestId(TEST_IDS.listItem);
const emptyState = () => getLocatorByTestId(TEST_IDS.emptyState);
const storeCard = (name: string) => cardByName(getPage(), listItems(), TEST_IDS.cardName, name);

export async function navigate(): Promise<void> {
  await goToPage(getPage(), '/stores');
}

export async function verifyIsLoaded(): Promise<void> {
  await expectList(header(), headerTitle(), searchContainer());
}

export async function searchFor(term: string): Promise<void> {
  await searchForInput(searchInput(), term);
}

export async function clearSearch(): Promise<void> {
  await clearSearchInput(searchInput());
}

export async function expectSearchValue(term: TextMatcher): Promise<void> {
  await expectSearchInputValue(searchInput(), term);
}

export async function expectNoResults(): Promise<void> {
  await expectEmptyList(emptyState(), listItems());
}

export async function readCard(name: string): Promise<StoreCard> {
  const card = storeCard(name);
  await expectVisible(card);
  return getStoreCardData(card);
}

export async function expectCardData(name: string, expected: Partial<StoreCard>): Promise<void> {
  const actual = await readCard(name);
  expect(actual).toMatchObject(expected);
}
