import { expect, type Locator, type Page } from '@playwright/test';
import { fillListSearch, type TextMatcher } from '@ui/support';
import { cardByName } from '../common/card.page';
import { expectNoDataState } from '../common/empty.page';
import {
  expectNetworkError as expectNetworkErrorState,
  expectServerError as expectServerErrorState,
} from '../common/error.page';
import { expectPageIndicator, goToNextListPage, goToPreviousListPage } from '../common/pagination.page';
import { getCompetitionCardData } from './competitions.card.page';
import { EMPTY_STATE, NO_DATA_COPY, TEST_IDS } from './competitions.constants';
import { type CompetitionCard } from './competitions.types';

const header = (page: Page) => page.getByTestId(TEST_IDS.header);
const headerTitle = (page: Page) => page.getByTestId(TEST_IDS.headerTitle);
const searchContainer = (page: Page) => page.getByTestId(TEST_IDS.search);
const searchInput = (page: Page) => searchContainer(page).getByTestId(TEST_IDS.searchInput);
export const listItems = (page: Page) => page.getByTestId(TEST_IDS.listItem);
const emptyState = (page: Page) => page.getByTestId(TEST_IDS.emptyState);
const emptyStateTitle = (page: Page) => page.getByTestId(TEST_IDS.emptyStateTitle);
const emptyStateMessage1 = (page: Page) => page.getByTestId(TEST_IDS.emptyStateMessageLine1);
const emptyStateMessage2 = (page: Page) => page.getByTestId(TEST_IDS.emptyStateMessageLine2);
const competitionCard = (page: Page, name: string): Locator =>
  cardByName(page, listItems(page), TEST_IDS.cardName, name);

export async function goTo(page: Page): Promise<void> {
  await page.goto('/competitions');
}

export async function expectTitle(page: Page, title: string): Promise<void> {
  await expect(headerTitle(page)).toHaveText(title);
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
  await fillListSearch(page, searchInput(page), '');
}

export async function expectSearchValue(page: Page, term: TextMatcher): Promise<void> {
  await expect(searchInput(page)).toHaveValue(term);
}

export async function expectNoResults(page: Page): Promise<void> {
  await expect(emptyState(page)).toBeVisible();
  await expect(listItems(page)).toHaveCount(0);
  await expect(emptyStateTitle(page)).toHaveText(EMPTY_STATE.title);
  await expect(emptyStateMessage1(page)).toHaveText(EMPTY_STATE.messageLine1);
  await expect(emptyStateMessage2(page)).toHaveText(EMPTY_STATE.messageLine2);
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

export async function readCard(page: Page, name: string): Promise<CompetitionCard> {
  const card = competitionCard(page, name);
  await expect(card).toBeVisible();
  return getCompetitionCardData(card);
}

export async function expectCardData(
  page: Page,
  expected: Pick<CompetitionCard, 'name'> & Partial<CompetitionCard>,
): Promise<void> {
  const actual = await readCard(page, expected.name);
  expect(actual).toMatchObject(expected);
}

export async function expectCardAbsent(page: Page, name: string): Promise<void> {
  await expect(competitionCard(page, name)).toHaveCount(0);
}

export async function goToNextPage(page: Page): Promise<void> {
  await goToNextListPage(page);
}

export async function goToPreviousPage(page: Page): Promise<void> {
  await goToPreviousListPage(page);
}

export async function expectPagination(page: Page, currentPage: number, totalPages: number): Promise<void> {
  await expectPageIndicator(page, currentPage, totalPages);
}
