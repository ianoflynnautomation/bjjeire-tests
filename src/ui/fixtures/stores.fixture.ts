import type { Page } from '@playwright/test';
import { bindPage, type BoundPageObject } from './bind-page';
import * as StoresPageMod from '@ui/pages/stores/stores.page';

export type StoresPage = BoundPageObject<typeof StoresPageMod>;

export async function storesPageFixture(
  { page }: { page: Page },
  use: (storesPage: StoresPage) => Promise<void>,
): Promise<void> {
  await use(bindPage(StoresPageMod, page));
}
