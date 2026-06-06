import type { Page } from '@playwright/test';
import { bindPage, type BoundPageObject } from './bind-page';
import * as CompetitionsPageMod from '@ui/pages/competitions/competitions.page';

export type CompetitionsPage = BoundPageObject<typeof CompetitionsPageMod>;

export async function competitionsPageFixture(
  { page }: { page: Page },
  use: (competitionsPage: CompetitionsPage) => Promise<void>,
): Promise<void> {
  await use(bindPage(CompetitionsPageMod, page));
}
