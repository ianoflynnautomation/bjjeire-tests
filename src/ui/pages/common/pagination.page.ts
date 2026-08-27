import { expect, type Page } from '@playwright/test';

const TEST_IDS = {
  nextButton: 'pagination-next-button',
  pageIndicator: 'pagination-page-indicator',
  prevButton: 'pagination-prev-button',
  root: 'pagination',
} as const;

const PAGE_INDICATOR_PATTERN = /^(\d+)\s*\/\s*(\d+)$/;

const pagination = (page: Page) => page.getByTestId(TEST_IDS.root);
const pageIndicator = (page: Page) => pagination(page).getByTestId(TEST_IDS.pageIndicator);

async function readPageIndicator(page: Page): Promise<{ current: number; total: number }> {
  const text = (await pageIndicator(page).innerText()).trim();
  const match = PAGE_INDICATOR_PATTERN.exec(text);
  if (!match) {
    throw new Error(`Unexpected pagination indicator: ${text}`);
  }
  return { current: Number(match[1]), total: Number(match[2]) };
}

export async function goToNextListPage(page: Page): Promise<void> {
  const { current, total } = await readPageIndicator(page);
  await pagination(page).getByTestId(TEST_IDS.nextButton).click();
  await expect(pageIndicator(page)).toHaveText(`${current + 1} / ${total}`);
}

export async function goToPreviousListPage(page: Page): Promise<void> {
  const { current, total } = await readPageIndicator(page);
  await pagination(page).getByTestId(TEST_IDS.prevButton).click();
  await expect(pageIndicator(page)).toHaveText(`${current - 1} / ${total}`);
}

export async function expectPageIndicator(page: Page, currentPage: number, totalPages: number): Promise<void> {
  await expect(pageIndicator(page)).toHaveText(`${currentPage} / ${totalPages}`);
}
