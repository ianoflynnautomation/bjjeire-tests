import { expect, type Page } from '@playwright/test';

export const NO_DATA = {
  title: 'no-data-state-title',
  messageLine1: 'no-data-state-message-line1',
  messageLine2: 'no-data-state-message-line2',
} as const;

export type NoDataCopy = {
  title: string;
  line1: string;
  line2: string;
};

export async function expectNoDataState(page: Page, copy: NoDataCopy): Promise<void> {
  await expect(page.getByTestId(NO_DATA.title)).toHaveText(copy.title);
  await expect(page.getByTestId(NO_DATA.messageLine1)).toHaveText(copy.line1);
  await expect(page.getByTestId(NO_DATA.messageLine2)).toHaveText(copy.line2);
}

export const emptyPage = {
  data: [],
  pagination: {
    totalItems: 0,
    currentPage: 1,
    pageSize: 25,
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: false,
    nextPageUrl: null,
    previousPageUrl: null,
  },
};
