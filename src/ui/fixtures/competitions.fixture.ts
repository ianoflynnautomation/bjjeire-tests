import type { Page } from '@playwright/test';
import { bindPage, type BoundPageObject } from './bind-page';
import * as CompetitionsPageMod from '@ui/pages/competitions/competitions.page';
import { mockCompetitions } from '@ui/mocks/competitions.mock';

export type CompetitionsPage = BoundPageObject<typeof CompetitionsPageMod>;
export type MockCompetitions = (body: unknown) => Promise<void>;

export async function competitionsPageFixture(
  { page }: { page: Page },
  use: (competitionsPage: CompetitionsPage) => Promise<void>,
): Promise<void> {
  await use(bindPage(CompetitionsPageMod, page));
}

export async function mockCompetitionsFixture(
  { page }: { page: Page },
  use: (mock: MockCompetitions) => Promise<void>,
): Promise<void> {
  await use(body => mockCompetitions(page, body));
}
