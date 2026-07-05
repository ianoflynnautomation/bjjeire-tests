import { expect, type Locator, type Page } from '@playwright/test';
import type { TextMatcher } from '@ui/support';
import { cardByName } from '../common/card.page';
import { expectNoDataState } from '../common/empty.page';
import {
  expectNetworkError as expectNetworkErrorState,
  expectNoError as expectNoErrorState,
  expectServerError as expectServerErrorState,
  retryAfterError as retryAfterErrorState,
} from '../common/error.page';
import { getGymCardData } from './gyms.card.page';
import { NO_DATA_COPY, TEST_IDS } from './gyms.constants';
import type { GymCard } from './gyms.types';

const ALL_COUNTIES_OPTION = 'all';

const header = (page: Page) => page.getByTestId(TEST_IDS.header);
const headerTitle = (page: Page) => page.getByTestId(TEST_IDS.headerTitle);
const searchContainer = (page: Page) => page.getByTestId(TEST_IDS.search);
const searchInput = (page: Page) => searchContainer(page).getByTestId(TEST_IDS.searchInput);
const countySelect = (page: Page) => page.getByTestId(TEST_IDS.countySelect);
const listItems = (page: Page) => page.getByTestId(TEST_IDS.listItem);
const emptyState = (page: Page) => page.getByTestId(TEST_IDS.emptyState);
const gymCard = (page: Page, name: string): Locator => cardByName(page, listItems(page), TEST_IDS.cardName, name);

export async function goTo(page: Page): Promise<void> {
  await page.goto('/gyms');
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

export async function filterByCounty(page: Page, county: string): Promise<void> {
  await countySelect(page).selectOption(county);
}

export async function resetCountyFilter(page: Page): Promise<void> {
  await countySelect(page).selectOption(ALL_COUNTIES_OPTION);
}

export async function expectTitle(page: Page, title: string): Promise<void> {
  await expect(headerTitle(page)).toHaveText(title);
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

export async function retryAfterError(page: Page): Promise<void> {
  await retryAfterErrorState(page);
}

export async function expectListNotEmpty(page: Page): Promise<void> {
  await expectNoErrorState(page);
  await expect(listItems(page)).not.toHaveCount(0);
}

export async function readCard(page: Page, name: string): Promise<GymCard> {
  const card = gymCard(page, name);
  await expect(card).toBeVisible();
  return getGymCardData(card);
}

export async function expectCardData(page: Page, expected: Pick<GymCard, 'name'> & Partial<GymCard>): Promise<void> {
  const actual = await readCard(page, expected.name);
  expect(actual).toMatchObject(expected);
}

export async function expectCardAbsent(page: Page, name: string): Promise<void> {
  await expect(gymCard(page, name)).toHaveCount(0);
}

export async function expectCardLinks(
  page: Page,
  name: string,
  links: { website: string; googleMaps: string },
): Promise<void> {
  const card = gymCard(page, name);
  await expect(card.getByTestId(TEST_IDS.cardWebsiteLink)).toHaveAttribute('href', links.website);
  await expect(card.getByTestId(TEST_IDS.cardAddressLink)).toHaveAttribute('href', links.googleMaps);
}
