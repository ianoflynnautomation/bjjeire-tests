import { expect, type Locator, type Page } from '@playwright/test';
import type { FooterQuickLinkName } from './footer.types';
export { type FooterQuickLink, type FooterQuickLinkName } from './footer.types';

const footerSection = (page: Page) => page.getByRole('contentinfo');
const copyright = (page: Page) => page.getByTestId('footer-copyright');
const quickLinksHeading = (page: Page) => page.getByRole('heading', { name: 'Quick Links' });

export function quickLink(page: Page, name: FooterQuickLinkName): Locator {
  return footerSection(page).getByRole('link', { name, exact: true });
}

export async function clickFooterQuickLink(page: Page, name: FooterQuickLinkName): Promise<void> {
  await quickLink(page, name).click();
}

export async function expectFooterVisible(page: Page): Promise<void> {
  await expect(footerSection(page)).toBeVisible();
  await expect(copyright(page)).toBeVisible();
  await expect(quickLinksHeading(page)).toBeVisible();
}
