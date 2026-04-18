import { expect, type Locator, type Page } from '@playwright/test';

const NAV_TEST_IDS = {
  root: 'navigation',
  logoLink: 'navigation-logo-link',
  desktopLink: 'navigation-desktop-link',
  mobileToggle: 'navigation-mobile-toggle',
  mobilePanel: 'navigation-mobile-panel',
  mobileLink: 'navigation-mobile-link',
} as const;

export type NavBar = Readonly<{
  root: Locator;
  desktopLinks: Locator;
  verifyIsLoaded: () => Promise<void>;
  goTo: (label: string) => Promise<void>;
  expectLinkVisible: (label: string) => Promise<void>;
}>;

export function createNavBar(page: Page): NavBar {
  const root = page.getByTestId(NAV_TEST_IDS.root);
  const desktopLinks = page.getByTestId(NAV_TEST_IDS.desktopLink);

  return {
    root,
    desktopLinks,
    async verifyIsLoaded() {
      await expect(root).toBeVisible();
      await expect(page.getByTestId(NAV_TEST_IDS.logoLink)).toBeVisible();
    },
    async goTo(label) {
      await desktopLinks.filter({ hasText: label }).first().click();
    },
    async expectLinkVisible(label) {
      await expect(desktopLinks.filter({ hasText: label }).first()).toBeVisible();
    },
  };
}
