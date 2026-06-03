import type { Locator, Page } from '@playwright/test';

export function cardByName(page: Page, items: Locator, cardNameTestId: string, name: string): Locator {
  const cardName = page.getByTestId(cardNameTestId).filter({ hasText: name });
  return items.filter({ has: cardName });
}
