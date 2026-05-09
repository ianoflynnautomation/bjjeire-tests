import { expect, type Locator } from '@playwright/test';
import type { TextMatcher } from './page-types';

export async function expectListShell(header: Locator, headerTitle: Locator, searchContainer: Locator): Promise<void> {
  await expect(header).toBeVisible();
  await expect(headerTitle).toBeVisible();
  await expect(searchContainer).toBeVisible();
}

export async function expectTitle(title: Locator, value: TextMatcher): Promise<void> {
  await expect(title).toHaveText(value);
}

export async function expectSearchValue(input: Locator, value: TextMatcher): Promise<void> {
  await expect(input).toHaveValue(value);
}

export async function expectResultCount(rows: Locator, count: number): Promise<void> {
  await expect(rows).toHaveCount(count);
}

export async function expectAtLeastOneRow(rows: Locator): Promise<void> {
  await expect(rows.first()).toBeVisible();
}

export async function expectEmptyState(emptyState: Locator, rows?: Locator): Promise<void> {
  await expect(emptyState).toBeVisible();
  if (rows) {
    await expect(rows).toHaveCount(0);
  }
}
