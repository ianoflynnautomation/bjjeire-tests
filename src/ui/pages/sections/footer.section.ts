import { expect, type Locator, type Page } from '@playwright/test';
import type { FooterQuickLinkName } from './footer.types';

export { type FooterQuickLink, type FooterQuickLinkName } from './footer.types';

export class FooterSection {
  constructor(private readonly page: Page) {}

  private get section(): Locator {
    return this.page.getByRole('contentinfo');
  }

  quickLink(name: FooterQuickLinkName): Locator {
    return this.section.getByRole('link', { name, exact: true });
  }

  async clickQuickLink(name: FooterQuickLinkName): Promise<void> {
    await this.quickLink(name).click();
  }

  async expectVisible(): Promise<void> {
    await expect(this.section).toBeVisible();
    await expect(this.page.getByTestId('footer-copyright')).toBeVisible();
    await expect(this.page.getByRole('heading', { name: 'Quick Links' })).toBeVisible();
  }
}
