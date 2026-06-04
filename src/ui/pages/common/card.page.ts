import type { Locator, Page } from '@playwright/test';

export function cardByName(page: Page, items: Locator, cardNameTestId: string, name: string): Locator {
  const cardName = page.getByTestId(cardNameTestId).filter({ hasText: name });
  return items.filter({ has: cardName });
}

export async function readTaggedItemsIfVisible(
  container: Locator,
  items: Locator,
  options?: TimeoutOption,
): Promise<string[]> {
  if (!(await container.isVisible(options))) {
    return [];
  }

  const values = await items.allInnerTexts();
  return values.map(value => value.trim()).filter(Boolean);
}

type TimeoutOption = { timeout?: number };
