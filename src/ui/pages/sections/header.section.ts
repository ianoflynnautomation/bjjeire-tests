import { expect, type Locator, type Page } from '@playwright/test';

const TEST_IDS = {
  logoLink: 'navigation-logo-link',
  supportButton: 'navigation-support-button',
  supportModalContent: 'support-modal-content',
} as const;

export class HeaderSection {
  constructor(private readonly page: Page) {}

  private get navigation(): Locator {
    return this.page.getByRole('navigation');
  }

  async expectVisible(): Promise<void> {
    await expect(this.navigation).toBeVisible();
    await expect(this.page.getByTestId(TEST_IDS.logoLink)).toBeVisible();
  }

  async clickSupportButton(): Promise<void> {
    await this.page.getByTestId(TEST_IDS.supportButton).click();
    await expect(this.page.getByTestId(TEST_IDS.supportModalContent)).toBeVisible();
  }
}
