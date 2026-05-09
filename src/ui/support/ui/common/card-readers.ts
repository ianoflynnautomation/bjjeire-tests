import { expect, type Locator } from '@playwright/test';

export async function readText(locator: Locator): Promise<string> {
  await expect(locator).toBeVisible();
  const raw = await locator.innerText();
  return raw.trim();
}

export async function readTextIfVisible(locator: Locator): Promise<string | null> {
  if (!(await locator.isVisible())) return null;
  const raw = await locator.innerText();
  return raw.trim();
}

export async function readTaggedItemsIfVisible(container: Locator, item: Locator): Promise<string[]> {
  if (!(await container.isVisible())) return [];
  const texts = await item.allInnerTexts();
  return texts.map(text => text.trim());
}
