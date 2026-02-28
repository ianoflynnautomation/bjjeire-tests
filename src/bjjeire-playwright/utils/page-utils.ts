import { type Page } from '@playwright/test';

let page: Page;

export function getPage(): Page {
  return page;
}

export function setPage(pageInstance: Page): void {
  page = pageInstance;
}
