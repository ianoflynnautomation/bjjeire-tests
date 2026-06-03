import type { Locator } from '@playwright/test';
import { getPage } from '@ui/support/ui';
import type { FooterQuickLinkName } from './footer.types';

export function footerRoot(): Locator {
  return getPage().getByRole('contentinfo');
}

export function copyright(): Locator {
  return getPage().getByTestId('footer-copyright');
}

export function quickLinksHeading(): Locator {
  return footerRoot().getByRole('heading', { name: 'Quick Links' });
}

export function quickLink(name: FooterQuickLinkName): Locator {
  return footerRoot().getByRole('link', { name, exact: true });
}
