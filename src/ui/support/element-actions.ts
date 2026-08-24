import type { Locator } from '@playwright/test';
import { TIMEOUTS } from '@shared/config/timeouts';

export async function getText(locator: Locator): Promise<string> {
  return (await locator.innerText()).trim();
}

export async function getTextIfPresent(locator: Locator): Promise<string | null> {
  try {
    await locator.first().waitFor({ state: 'visible', timeout: TIMEOUTS.instant });
  } catch {
    return null;
  }
  return getText(locator.first());
}
