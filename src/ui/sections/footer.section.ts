import { getLocatorByRole, getLocatorByTestId } from '@ui/support';
import type { FooterQuickLinkName } from './footer.types';
import { expect, type Locator } from 'playwright/test';
import { click } from '@ui/support/element-actions';
export { type FooterQuickLink, type FooterQuickLinkName } from './footer.types';

const footerSection = () => getLocatorByRole('contentinfo');
const copyright = () => getLocatorByTestId('footer-copyright');
const quickLinksHeading = () => getLocatorByRole('heading', { name: 'Quick Links' });

export function quickLink(name: FooterQuickLinkName): Locator {
  return footerSection().getByRole('link', { name, exact: true });
}

export async function clickFooterQuickLink(name: FooterQuickLinkName): Promise<void> {
  await click(quickLink(name));
}

export async function expectFooterVisible(): Promise<void> {
  await expect(footerSection()).toBeVisible();
  await expect(copyright()).toBeVisible();
  await expect(quickLinksHeading()).toBeVisible();
}
export function expectVisible() {
  throw new Error('Function not implemented.');
}
