import type { Page } from '@playwright/test';
import { bindPage, type BoundPageObject } from './bind-page';
import * as TemplatePageMod from '@ui/pages/_template/_template.page';

export type TemplatePage = BoundPageObject<typeof TemplatePageMod>;

export async function templatePageFixture(
  { page }: { page: Page },
  use: (templatePage: TemplatePage) => Promise<void>,
): Promise<void> {
  await use(bindPage(TemplatePageMod, page));
}
