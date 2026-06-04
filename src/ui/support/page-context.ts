import type { Page } from '@playwright/test';
import { UiPageContextError } from './errors/errors';

let currentPage: Page | undefined;

export function setPage(page: Page): void {
  currentPage = page;
}

export function clearPage(): void {
  currentPage = undefined;
}

export function getPage(): Page {
  if (!currentPage) {
    throw new UiPageContextError(
      'Playwright page context is not set. Import test from @shared/fixtures or @ui/fixtures.',
    );
  }

  return currentPage;
}
