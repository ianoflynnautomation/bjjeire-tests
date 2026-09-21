import { expect, type Locator, type Page } from '@playwright/test';
import { gotoRoute, waitForRouteMounted } from '@ui/support';

export class TemplatePage {
  constructor(private readonly page: Page) {}

  private get main(): Locator {
    return this.page.getByRole('main');
  }

  async navigate(): Promise<void> {
    await gotoRoute(this.page, '/template', this.main);
  }

  async verifyIsLoaded(): Promise<void> {
    await waitForRouteMounted(this.main);
    await expect(this.page).toHaveURL(/\/template$/);
    await expect(this.main).toBeVisible();
  }
}
