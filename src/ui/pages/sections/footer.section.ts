import { expect, type Locator, type Page } from '@playwright/test';
import type { FooterQuickLinkName } from './footer.types';

export class FooterSection {
  constructor(private readonly page: Page) {}

  private get section(): Locator {
    return this.page.getByRole('contentinfo');
  }

  quickLink(name: FooterQuickLinkName): Locator {
    return this.section.getByRole('link', { name, exact: true });
  }

  /** The quick links offer a link named `name` that goes to `path`. */
  async expectQuickLink(name: FooterQuickLinkName, path: string): Promise<void> {
    await expect(this.quickLink(name)).toHaveAttribute('href', path);
  }

  async expectVisible(): Promise<void> {
    await expect(this.section).toBeVisible();
    await expect(this.page.getByTestId('footer-copyright')).toBeVisible();
    await expect(this.page.getByRole('heading', { name: 'Quick Links' })).toBeVisible();
  }
}
