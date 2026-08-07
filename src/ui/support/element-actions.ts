import type { Locator } from '@playwright/test';

export async function getText(locator: Locator): Promise<string> {
  return (await locator.innerText()).trim();
}

export async function getTextIfPresent(locator: Locator): Promise<string | null> {
  if ((await locator.count()) === 0) {
    return null;
  }
  return getText(locator.first());
}
