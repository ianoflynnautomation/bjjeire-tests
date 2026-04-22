import { expect, type Locator } from '@playwright/test';

export async function expectListShell(header: Locator, headerTitle: Locator, searchContainer: Locator): Promise<void> {
  await expect(header).toBeVisible();
  await expect(headerTitle).toBeVisible();
  await expect(searchContainer).toBeVisible();
}

export async function expectSearchValue(input: Locator, value: RegExp | string): Promise<void> {
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
