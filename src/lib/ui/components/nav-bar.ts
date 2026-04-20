import type { Locator, Page } from '@playwright/test';
import { createScreenActions } from '@lib/ui/actions';
import { createScreenAssertions } from '@lib/ui/assertions';

export type NavBar = Readonly<{
  root: Locator;
  desktopLinks: Locator;
  verifyIsLoaded: () => Promise<void>;
  goTo: (label: string) => Promise<void>;
  expectLinkVisible: (label: string) => Promise<void>;
}>;

export function createNavBar(page: Page): NavBar {
  const actions = createScreenActions(page);
  const assertions = createScreenAssertions(page);
  const root = page.getByRole('navigation');
  const desktopLinks = root.getByRole('link');
  const firstLink = root.getByRole('link').first();

  return {
    root,
    desktopLinks,
    async verifyIsLoaded() {
      await assertions.expectElementVisible(root);
      await assertions.expectElementVisible(firstLink);
    },
    async goTo(label) {
      await actions.click(root.getByRole('link', { name: label, exact: true }).first());
    },
    async expectLinkVisible(label) {
      await assertions.expectElementVisible(root.getByRole('link', { name: label, exact: true }).first());
    },
  };
}
