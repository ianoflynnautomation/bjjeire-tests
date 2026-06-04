import { expect } from '@playwright/test';
import {
  expectToHaveCount,
  expectToHaveText,
  expectVisible,
  getLocatorByTestId,
  getPage,
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

const header = () => getLocatorByTestId(TEST_IDS.header);
const headerTitle = () => getLocatorByTestId(TEST_IDS.headerTitle);
const searchContainer = () => getLocatorByTestId(TEST_IDS.search);
const searchInput = () => searchContainer().getByTestId(TEST_IDS.searchInput);
const listItems = () => getLocatorByTestId(TEST_IDS.listItem);
const emptyState = () => getLocatorByTestId(TEST_IDS.emptyState);
const emptyStateTitle = () => getLocatorByTestId(TEST_IDS.emptyStateTitle);
const emptyStateMessage1 = () => getLocatorByTestId(TEST_IDS.emptyStateMessageLine1);
const emptyStateMessage2 = () => getLocatorByTestId(TEST_IDS.emptyStateMessageLine2);
const competitionCard = (name: string) => cardByName(getPage(), listItems(), TEST_IDS.cardName, name);

export async function navigate(): Promise<void> {
  await goToPage(getPage(), '/competitions');
  await getTitle();
}

export async function getTitle(): Promise<void> {
  await expectToHaveText(headerTitle(), 'BJJ Competition Organisations');
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
  await expectToHaveText(emptyStateTitle(), EMPTY_STATE.title);
  await expectToHaveText(emptyStateMessage1(), EMPTY_STATE.messageLine1);
  await expectToHaveText(emptyStateMessage2(), EMPTY_STATE.messageLine2);
}

export async function expectResultCount(count: number): Promise<void> {
  await expectToHaveCount(listItems(), count);
}

export async function getCardData(name: string): Promise<CompetitionCard> {
  const card = competitionCard(name);
  await expectVisible(card);
  return getCompetitionCardData(card);
}

export async function expectCardData(name: string, expected: Partial<CompetitionCard>): Promise<void> {
  const actual = await getCardData(name);
  expect(actual).toMatchObject(expected);
}
