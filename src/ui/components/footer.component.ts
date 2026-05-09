import { expect, type Locator } from '@playwright/test';
import { getPage } from '@ui/support/ui';

export type FooterQuickLinkName = 'Gyms' | 'Competitions' | 'Stores' | 'About';

export const root = (): Locator => getPage().getByRole('contentinfo');
export const copyright = (): Locator => getPage().getByTestId('footer-copyright');
export const quickLinks = (): Locator => root().getByRole('heading', { name: 'Quick Links' });
export const quickLink = (name: FooterQuickLinkName): Locator => root().getByRole('link', { name, exact: true });

export async function clickQuickLink(name: FooterQuickLinkName): Promise<void> {
  await quickLink(name).click();
}

export async function expectVisible(): Promise<void> {
  await expect(root()).toBeVisible();
  await expect(copyright()).toBeVisible();
  await expect(quickLinks()).toBeVisible();
}
