import type { Locator } from '@playwright/test';
import { expectToHaveCount, expectVisible } from '@ui/support';

export async function expectList(header: Locator, headerTitle: Locator, searchContainer: Locator): Promise<void> {
  await expectVisible(header);
  await expectVisible(headerTitle);
  await expectVisible(searchContainer);
}

export async function expectEmptyList(emptyState: Locator, rows?: Locator): Promise<void> {
  await expectVisible(emptyState);
  if (rows) {
    await expectToHaveCount(rows, 0);
  }
}
