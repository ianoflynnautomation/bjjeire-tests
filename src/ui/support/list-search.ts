import { expect, type Locator, type Page } from '@playwright/test';

export async function fillListSearch(page: Page, input: Locator, term: string): Promise<void> {
  await input.clear();
  if (term.length === 0) {
    await expect(page).toHaveURL(url => !url.searchParams.has('q'));
    await expect(input).toHaveValue('');
    return;
  }
  await input.fill(term);
  await expect(page).toHaveURL(url => url.searchParams.get('q') === term);
  await expect(input).toHaveValue(term);
}

export async function clearListSearch(page: Page, input: Locator): Promise<void> {
  await fillListSearch(page, input, '');
}

export async function waitForListOrEmpty(listItems: Locator, emptyState: Locator): Promise<void> {
  await expect(listItems.or(emptyState).first()).toBeVisible();
}

export async function waitForCardsMatching(
  listItems: Locator,
  emptyState: Locator,
  fieldTestId: string,
  expectedText: string,
): Promise<void> {
  await expect(async () => {
    if (await emptyState.isVisible()) {
      return;
    }
    const count = await listItems.count();
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < count; i++) {
      await expect(listItems.nth(i).getByTestId(fieldTestId)).toContainText(expectedText);
    }
  }).toPass();
}
