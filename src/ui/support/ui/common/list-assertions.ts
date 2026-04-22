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
  expect(await rows.count()).toBeGreaterThan(0);
}

export async function expectEmptyState(emptyState: Locator, rows?: Locator): Promise<void> {
  await expect(emptyState).toBeVisible();
  if (rows) {
    await expect(rows).toHaveCount(0);
  }
}

export async function expectRowVisible(row: Locator): Promise<void> {
  await expect(row).toBeVisible();
}

export async function expectRowText(row: Locator, text: RegExp | string): Promise<void> {
  await expect(row).toHaveText(text);
}
