import type { Locator } from '@playwright/test';
import { expectToHaveValue, type TextMatcher } from '@ui/support';
import { clearInput, fillInput } from '@ui/support/element-actions';

export async function searchFor(searchInput: Locator, term: string): Promise<void> {
  await clearInput(searchInput);
  await fillInput(searchInput, term);
}

export async function clearSearch(searchInput: Locator): Promise<void> {
  await clearInput(searchInput);
}

export async function expectSearchValue(searchInput: Locator, term: TextMatcher): Promise<void> {
  await expectToHaveValue(searchInput, term);
}
