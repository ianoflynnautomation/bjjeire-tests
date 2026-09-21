import { expect, type Locator, type Page } from '@playwright/test';

export async function fillListSearch(page: Page, input: Locator, term: string): Promise<void> {
  await input.fill(term);
  await expect(input).toHaveValue(term);
  await expect(page).toHaveURL(url =>
    term.length === 0 ? !url.searchParams.has('q') : url.searchParams.get('q') === term,
  );
}

export async function clearListSearch(page: Page, input: Locator): Promise<void> {
  await fillListSearch(page, input, '');
}

export async function waitForListOrEmpty(listItems: Locator, emptyState: Locator): Promise<void> {
  await expect(listItems.or(emptyState).first()).toBeVisible();
}

function containsExactly(text: string): RegExp {
  return new RegExp(text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
}

export async function expectAllCardsMatch(
  listItems: Locator,
  emptyState: Locator,
  fieldTestId: string,
  expectedText: string,
): Promise<void> {
  const matchingField = listItems
    .page()
    .getByTestId(fieldTestId)
    .filter({ hasText: containsExactly(expectedText) });
  const mismatched = listItems.filter({ hasNot: matchingField });

  await waitForListOrEmpty(listItems, emptyState);
  await expect(mismatched, `cards whose '${fieldTestId}' does not contain '${expectedText}'`).toHaveCount(0);
}
