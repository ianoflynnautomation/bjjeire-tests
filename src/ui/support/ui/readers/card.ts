import type { Locator } from '@playwright/test';
import { UiElementReadError } from '../errors';

export async function readText(locator: Locator): Promise<string> {
  const raw = await locator.textContent();

  if (raw === null) {
    throw new UiElementReadError('Expected locator to have text content, but it resolved to null.');
  }

  return raw.trim();
}

export async function readTextIfVisible(locator: Locator): Promise<string | null> {
  if (!(await locator.isVisible())) return null;
  return readText(locator);
}

export async function readTaggedItemsIfVisible(container: Locator, item: Locator): Promise<string[]> {
  if (!(await container.isVisible())) return [];
  const texts = await item.allTextContents();
  return texts.map(text => text.trim());
}
