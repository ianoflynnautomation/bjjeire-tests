import type { Locator, Page } from '@playwright/test';
import { TIMEOUTS } from '@shared/config/timeouts';

export function cardByName(page: Page, items: Locator, cardNameTestId: string, name: string): Locator {
  const cardName = page.getByTestId(cardNameTestId).filter({ hasText: name });
  return items.filter({ has: cardName });
}

export async function readTaggedItemsIfPresent(container: Locator, items: Locator): Promise<string[]> {
  try {
    await container.first().waitFor({ state: 'visible', timeout: TIMEOUTS.instant });
  } catch {
    return [];
  }

  const values = await items.allInnerTexts();
  return values.map(value => value.trim()).filter(Boolean);
}
