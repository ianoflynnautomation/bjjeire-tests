import type { Page } from '@playwright/test';
import { bindPage, type BoundPageObject } from './bind-page';
import * as AboutPageMod from '@ui/pages/about/about.page';

export type AboutPage = BoundPageObject<typeof AboutPageMod>;

export async function aboutPageFixture(
  { page }: { page: Page },
  use: (aboutPage: AboutPage) => Promise<void>,
): Promise<void> {
  await use(bindPage(AboutPageMod, page));
}
