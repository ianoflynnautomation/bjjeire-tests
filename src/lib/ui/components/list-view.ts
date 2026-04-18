import { expect, type Locator, type Page } from '@playwright/test';
import { gotoURL } from '@lib/ui/actions';
import { TIMEOUTS } from '@lib/config';

function routeToLabel(route: string): string {
  const trimmed = route.replace(/^\//, '');
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

export type ListViewIds = Readonly<{
  route: string;
  header: string;
  headerTitle: string;
  headerTotal: string;
  search: string;
  list: string;
  listItem: string;
  listEmpty?: string;
  listError?: string;
}>;

export type ListView = Readonly<{
  ids: ListViewIds;
  items: Locator;
  searchInput: Locator;
  navigate: () => Promise<void>;
  verifyIsLoaded: () => Promise<void>;
  verifyListSettled: () => Promise<void>;
  expectAtLeastOneResult: () => Promise<void>;
  expectNoResults: () => Promise<void>;
  searchFor: (term: string) => Promise<void>;
  clearSearch: () => Promise<void>;
  expectSearchValue: (term: string) => Promise<void>;
  expectHeaderVisible: () => Promise<void>;
}>;

export function createListView(page: Page, ids: ListViewIds): ListView {
  const items = page.getByTestId(ids.listItem);
  const searchInput = page.getByTestId(ids.search).getByRole('searchbox');

  const api: ListView = {
    ids,
    items,
    searchInput,

    async navigate() {
      const flagsReady = page
        .waitForResponse(resp => /\/api\/featureflag/i.test(resp.url()) && resp.ok(), {
          timeout: TIMEOUTS.navigation,
        })
        .catch(() => null);

      await gotoURL(page, ids.route);
      await flagsReady;

      if (new URL(page.url()).pathname !== ids.route) {
        const label = routeToLabel(ids.route);
        await page.getByRole('navigation').getByRole('link', { name: label, exact: true }).first().click();
        await page.waitForURL(new RegExp(`${ids.route}(?:[/?#]|$)`));
      }
    },

    async verifyIsLoaded() {
      await expect(page.getByTestId(ids.header)).toBeVisible();
      await expect(page.getByTestId(ids.headerTitle)).toBeVisible();
      await expect(page.getByTestId(ids.search)).toBeVisible();
    },

    async verifyListSettled() {
      const empty = ids.listEmpty ? page.getByTestId(ids.listEmpty) : null;
      await expect
        .poll(
          async () => {
            const hasItems = (await items.count()) > 0;
            const hasEmpty = empty ? await empty.isVisible().catch(() => false) : false;
            return hasItems || hasEmpty;
          },
          { message: `List on ${ids.route} never settled (no items and no empty state)` },
        )
        .toBe(true);
      if ((await items.count()) > 0) {
        await expect(items.first()).toBeVisible();
      }
    },

    async expectAtLeastOneResult() {
      await expect(items.first()).toBeVisible();
      expect(await items.count()).toBeGreaterThan(0);
    },

    async expectNoResults() {
      if (!ids.listEmpty) {
        await expect(items).toHaveCount(0);
        return;
      }
      await expect(page.getByTestId(ids.listEmpty)).toBeVisible();
    },

    async searchFor(term) {
      await searchInput.fill(term);
    },

    async clearSearch() {
      await searchInput.fill('');
    },

    async expectSearchValue(term) {
      await expect(searchInput).toHaveValue(term);
    },

    async expectHeaderVisible() {
      await expect(page.getByTestId(ids.header)).toBeVisible();
    },
  };

  return api;
}
