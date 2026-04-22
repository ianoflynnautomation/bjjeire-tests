import { expect, type Page } from '@playwright/test';
import { gotoURL } from '@ui/support/ui';

export type TemplateScreen = Readonly<{
  navigate: () => Promise<void>;
  verifyIsLoaded: () => Promise<void>;
}>;

export function getTemplateLocators(page: Page) {
  return {
    main: page.getByRole('main'),
  };
}

export function createTemplateScreen(page: Page): TemplateScreen {
  const locators = getTemplateLocators(page);

  return {
    async navigate() {
      await gotoURL(page, '/template');
    },
    verifyIsLoaded: () => expect(locators.main).toBeVisible(),
  };
}
