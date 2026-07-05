import { expect, type Page } from '@playwright/test';

const TEST_IDS = {
  nextButton: 'pagination-next-button',
  pageIndicator: 'pagination-page-indicator',
  prevButton: 'pagination-prev-button',
  root: 'pagination',
} as const;

const pagination = (page: Page) => page.getByTestId(TEST_IDS.root);

export async function goToNextListPage(page: Page): Promise<void> {
  await pagination(page).getByTestId(TEST_IDS.nextButton).click();
}

export async function goToPreviousListPage(page: Page): Promise<void> {
  await pagination(page).getByTestId(TEST_IDS.prevButton).click();
}

export async function expectPageIndicator(page: Page, currentPage: number, totalPages: number): Promise<void> {
  await expect(pagination(page).getByTestId(TEST_IDS.pageIndicator)).toHaveText(`${currentPage} / ${totalPages}`);
}
