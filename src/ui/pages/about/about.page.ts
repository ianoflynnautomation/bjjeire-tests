import { expect, type Locator, type Page } from '@playwright/test';
import { gotoRoute, waitForRouteMounted } from '@ui/support';
import { TEST_IDS } from './about.constants';

export class AboutPage {
  constructor(private readonly page: Page) {}

  private get main(): Locator {
    return this.page.getByRole('main');
  }

  get headerTitle(): Locator {
    return this.page.getByTestId(TEST_IDS.headerTitle);
  }

  get missionSection(): Locator {
    return this.page.getByTestId(TEST_IDS.missionSection);
  }

  get valuesSection(): Locator {
    return this.page.getByTestId(TEST_IDS.valuesSection);
  }

  get contactSection(): Locator {
    return this.page.getByTestId(TEST_IDS.contactSection);
  }

  async navigate(): Promise<void> {
    await gotoRoute(this.page, '/about', this.headerTitle);
  }

  async verifyIsLoaded(): Promise<void> {
    await waitForRouteMounted(this.headerTitle);
    await expect(this.page).toHaveURL(/\/about$/);
    await expect(this.main).toBeVisible();
    await expect(this.headerTitle).toBeVisible();
    await expect(this.missionSection).toBeVisible();
    await expect(this.valuesSection).toBeVisible();
    await expect(this.contactSection).toBeVisible();
  }
}
