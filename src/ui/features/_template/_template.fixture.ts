import { test as base } from '@playwright/test';
import { bindPage, type BoundPageObject } from '@ui/fixtures/bind-page';
import * as TemplatePageMod from '@ui/pages/_template/_template.page';

export type TemplatePage = BoundPageObject<typeof TemplatePageMod>;

export const test = base.extend<{ templatePage: TemplatePage }>({
  templatePage: async ({ page }, use) => {
    await use(bindPage(TemplatePageMod, page));
  },
});
