import type { Page } from '@playwright/test';
import { bindPage, type BoundPageObject } from './bind-page';
import * as GymsPageMod from '@ui/pages/gyms/gyms.page';

export type GymsPage = BoundPageObject<typeof GymsPageMod>;

export async function gymsPageFixture(
  { page }: { page: Page },
  use: (gymsPage: GymsPage) => Promise<void>,
): Promise<void> {
  await use(bindPage(GymsPageMod, page));
}
