import { expect, type Locator, type Page } from '@playwright/test';
import { HEADER_TEST_IDS, THEME_SWITCH_LABELS, Theme } from './header.constants';

export class HeaderSection {
  constructor(private readonly page: Page) {}

  private get navigation(): Locator {
    return this.page.getByTestId(HEADER_TEST_IDS.navigation);
  }

  async expectVisible(): Promise<void> {
    await expect(this.navigation).toBeVisible();
    await expect(this.page.getByTestId(HEADER_TEST_IDS.logoLink)).toBeVisible();
  }

  /** Clicks the theme toggle; it only offers the next theme in the cycle. */
  async switchTheme(to: Theme): Promise<void> {
    await this.navigation.getByRole('button', { name: THEME_SWITCH_LABELS[to] }).click();
  }

  /** Competition mode is a dark variant, so it carries both the `dark` and `competition` classes. */
  async expectTheme(theme: Theme): Promise<void> {
    const root = this.page.locator('html');
    if (theme === Theme.Light) {
      await expect(root).not.toHaveClass(/\bdark\b/);
    } else {
      await expect(root).toHaveClass(/\bdark\b/);
    }
    if (theme === Theme.Competition) {
      await expect(root).toHaveClass(/\bcompetition\b/);
    } else {
      await expect(root).not.toHaveClass(/\bcompetition\b/);
    }
  }

  async clickSupportButton(): Promise<void> {
    await this.page.getByTestId(HEADER_TEST_IDS.supportButton).click();
    await expect(this.page.getByTestId(HEADER_TEST_IDS.supportModalContent)).toBeVisible();
  }
}
