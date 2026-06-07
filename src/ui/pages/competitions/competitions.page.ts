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
import { getCompetitionCardData } from './competitions.card.page';
import { EMPTY_STATE, TEST_IDS } from './competitions.constants';
import { type CompetitionCard } from './competitions.types';

const header = (page: Page) => getLocatorByTestId(page, TEST_IDS.header);
const headerTitle = (page: Page) => getLocatorByTestId(page, TEST_IDS.headerTitle);
const searchContainer = (page: Page) => getLocatorByTestId(page, TEST_IDS.search);
const searchInput = (page: Page) => searchContainer(page).getByTestId(TEST_IDS.searchInput);
const listItems = (page: Page) => getLocatorByTestId(page, TEST_IDS.listItem);
const emptyState = (page: Page) => getLocatorByTestId(page, TEST_IDS.emptyState);
const emptyStateTitle = (page: Page) => getLocatorByTestId(page, TEST_IDS.emptyStateTitle);
const emptyStateMessage1 = (page: Page) => getLocatorByTestId(page, TEST_IDS.emptyStateMessageLine1);
const emptyStateMessage2 = (page: Page) => getLocatorByTestId(page, TEST_IDS.emptyStateMessageLine2);
const competitionCard = (page: Page, name: string) => cardByName(page, listItems(page), TEST_IDS.cardName, name);

export async function goTo(page: Page): Promise<void> {
  await goToPage(page, '/competitions');
  await getTitle(page);
}

export async function getTitle(page: Page): Promise<void> {
  await expectToHaveText(headerTitle(page), 'BJJ Competition Organisations');
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
  await expectToHaveText(emptyStateTitle(page), EMPTY_STATE.title);
  await expectToHaveText(emptyStateMessage1(page), EMPTY_STATE.messageLine1);
  await expectToHaveText(emptyStateMessage2(page), EMPTY_STATE.messageLine2);
}

export async function expectResultCount(page: Page, count: number): Promise<void> {
  await expectToHaveCount(listItems(page), count);
}

export async function getCardData(page: Page, name: string): Promise<CompetitionCard> {
  const card = competitionCard(page, name);
  await expectVisible(card);
  return getCompetitionCardData(card);
}

export async function expectCardData(page: Page, expected: CompetitionCard): Promise<void> {
  const actual = await getCardData(page, expected.name);
  expect(actual).toMatchObject(expected);
}
