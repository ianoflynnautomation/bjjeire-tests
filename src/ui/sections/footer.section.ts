import { expect, type Locator, type Page } from '@playwright/test';
import { getLocatorByRole, getLocatorByTestId } from '@ui/support';
import { click } from '@ui/support/element-actions';
import type { FooterQuickLinkName } from './footer.types';
export { type FooterQuickLink, type FooterQuickLinkName } from './footer.types';

const footerSection = (page: Page) => getLocatorByRole(page, 'contentinfo');
const copyright = (page: Page) => getLocatorByTestId(page, 'footer-copyright');
const quickLinksHeading = (page: Page) => getLocatorByRole(page, 'heading', { name: 'Quick Links' });

export function quickLink(page: Page, name: FooterQuickLinkName): Locator {
  return footerSection(page).getByRole('link', { name, exact: true });
}

export async function clickFooterQuickLink(page: Page, name: FooterQuickLinkName): Promise<void> {
  await click(quickLink(page, name));
}

export async function expectFooterVisible(page: Page): Promise<void> {
  await expect(footerSection(page)).toBeVisible();
  await expect(copyright(page)).toBeVisible();
  await expect(quickLinksHeading(page)).toBeVisible();
}
