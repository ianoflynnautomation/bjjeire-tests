import type { Locator } from '@playwright/test';

export async function getText(locator: Locator): Promise<string> {
  return (await locator.innerText()).trim();
}

export async function getTextIfPresent(locator: Locator): Promise<string | null> {
  const field = locator.first();
  return (await field.isVisible()) ? getText(field) : null;
}

export async function getAttributeIfPresent(locator: Locator, name: string): Promise<string | null> {
  const field = locator.first();
  return (await field.count()) > 0 ? field.getAttribute(name) : null;
}
