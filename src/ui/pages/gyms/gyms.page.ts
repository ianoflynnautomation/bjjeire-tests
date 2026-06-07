import { expect, type Locator, type Page } from '@playwright/test';
import type { TextMatcher } from '@ui/support';
import { cardByName } from '../common/card.page';
import { getGymCardData, type GymCard } from './gyms.card.page';
import { TEST_IDS } from './gyms.constants';

const header = (page: Page) => page.getByTestId(TEST_IDS.header);
const headerTitle = (page: Page) => page.getByTestId(TEST_IDS.headerTitle);
const searchContainer = (page: Page) => page.getByTestId(TEST_IDS.search);
const searchInput = (page: Page) => searchContainer(page).getByTestId(TEST_IDS.searchInput);
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

export async function expectTitle(page: Page, title: string): Promise<void> {
  await expect(headerTitle(page)).toHaveText(title);
}

export async function expectNoResults(page: Page): Promise<void> {
  await expect(emptyState(page)).toBeVisible();
  await expect(listItems(page)).toHaveCount(0);
}

export async function readCard(page: Page, name: string): Promise<GymCard> {
  const card = gymCard(page, name);
  await expect(card).toBeVisible();
  return getGymCardData(card);
}

export async function expectCardData(page: Page, expected: GymCard): Promise<void> {
  const card = gymCard(page, expected.name);
  await expect(card).toBeVisible();
  const actual = await getGymCardData(card);
  expect(actual).toMatchObject(expected);
}
