import type { Locator } from '@playwright/test';

export async function search(input: Locator, value: string): Promise<void> {
  await input.fill(value);
}

export async function clearSearch(input: Locator, clearButton?: Locator): Promise<void> {
  if (clearButton && (await clearButton.isVisible())) {
    await clearButton.click();
    return;
  }

  await input.fill('');
}
