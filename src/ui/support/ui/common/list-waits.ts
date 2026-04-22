import { expect, type Locator } from '@playwright/test';

export async function waitForLoadingToFinish(loadingState: Locator): Promise<void> {
  await expect(loadingState).toBeHidden();
}
