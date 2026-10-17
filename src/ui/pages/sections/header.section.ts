import { expect, type Locator, type Page } from '@playwright/test';
import { HEADER_TEST_IDS } from './header.constants';

export class HeaderSection {
  constructor(private readonly page: Page) {}

  private get navigation(): Locator {
    return this.page.getByTestId(HEADER_TEST_IDS.navigation);
  }

  async expectVisible(): Promise<void> {
    await expect(this.navigation).toBeVisible();
    await expect(this.page.getByTestId(HEADER_TEST_IDS.logoLink)).toBeVisible();
  }

  async clickSupportButton(): Promise<void> {
    await this.page.getByTestId(HEADER_TEST_IDS.supportButton).click();
    await expect(this.page.getByTestId(HEADER_TEST_IDS.supportModalContent)).toBeVisible();
  }
}
