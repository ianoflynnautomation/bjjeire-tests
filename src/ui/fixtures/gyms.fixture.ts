import type { Page } from '@playwright/test';
import { bindPage, type BoundPageObject } from './bind-page';
import * as GymsPageMod from '@ui/pages/gyms/gyms.page';
import { mockGyms } from '@ui/mocks/gyms.mock';

export type GymsPage = BoundPageObject<typeof GymsPageMod>;
export type MockGyms = (body: unknown) => Promise<void>;

export async function gymsPageFixture(
  { page }: { page: Page },
  use: (gymsPage: GymsPage) => Promise<void>,
): Promise<void> {
  await use(bindPage(GymsPageMod, page));
}

export async function mockGymsFixture({ page }: { page: Page }, use: (mock: MockGyms) => Promise<void>): Promise<void> {
  await use(body => mockGyms(page, body));
}
