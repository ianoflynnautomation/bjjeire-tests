import type { Locator } from '@playwright/test';

export async function getText(locator: Locator): Promise<string> {
  return (await locator.innerText()).trim();
}

export async function getTextIfVisible(locator: Locator): Promise<string | null> {
  if (!(await locator.isVisible())) {
    return null;
  }
  return getText(locator);
}
