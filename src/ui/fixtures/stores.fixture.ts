import type { Page } from '@playwright/test';
import { bindPage, type BoundPageObject } from './bind-page';
import * as StoresPageMod from '@ui/pages/stores/stores.page';
import { mockStores } from '@ui/mocks/stores.mock';

export type StoresPage = BoundPageObject<typeof StoresPageMod>;
export type MockStores = (body: unknown) => Promise<void>;

export async function storesPageFixture(
  { page }: { page: Page },
  use: (storesPage: StoresPage) => Promise<void>,
): Promise<void> {
  await use(bindPage(StoresPageMod, page));
}

export async function mockStoresFixture(
  { page }: { page: Page },
  use: (mock: MockStores) => Promise<void>,
): Promise<void> {
  await use(body => mockStores(page, body));
}
