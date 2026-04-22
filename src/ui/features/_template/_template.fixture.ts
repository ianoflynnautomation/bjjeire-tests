import { test as base } from '@playwright/test';
import { createTemplateScreen, type TemplateScreen } from './_template.screen';

export type TemplateFixtures = {
  templateScreen: TemplateScreen;
};

export const test = base.extend<TemplateFixtures>({
  templateScreen: async ({ page }, use) => {
    await use(createTemplateScreen(page));
  },
});
