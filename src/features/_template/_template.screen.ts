import type { Page } from '@playwright/test';
import { createScreenDriver } from '@shared/ui';

export type TemplateScreen = Readonly<{
  navigate: () => Promise<void>;
  verifyIsLoaded: () => Promise<void>;
}>;

export function createTemplateScreen(page: Page): TemplateScreen {
  const screen = createScreenDriver(page);

  return {
    async navigate() {
      await screen.actions.navigate('/template');
    },
    async verifyIsLoaded() {
      await screen.assertions.expectElementVisible(page.getByRole('main'));
    },
  };
}
