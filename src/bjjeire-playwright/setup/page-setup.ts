import { type Page, test as baseTest } from '@playwright/test';
import { setPage } from '../utils/page-utils';

baseTest.beforeEach(({ page }: { page: Page }) => {
  setPage(page);
});

export const test = baseTest;
