import { expect, type Locator, type Page } from '@playwright/test';
import { createScreenActions } from '@lib/ui/actions';
import { createScreenAssertions } from '@lib/ui/assertions';
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
  searchFor: (term: string) => Promise<void>;
  clearSearch: () => Promise<void>;
  expectSearchValue: (term: string) => Promise<void>;
}>;

export function createListView(page: Page, ids: ListViewIds): ListView {
  const actions = createScreenActions(page);
  const assertions = createScreenAssertions(page);
  const items = page.getByTestId(ids.listItem);
  const searchInput = page.getByTestId(ids.search).getByRole('searchbox');
  const header = page.getByTestId(ids.header);
  const headerTitle = page.getByTestId(ids.headerTitle);
  const search = page.getByTestId(ids.search);

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

      await actions.navigate(ids.route);
      await flagsReady;

      if (new URL(page.url()).pathname !== ids.route) {
        const label = routeToLabel(ids.route);
        await page.getByRole('navigation').getByRole('link', { name: label, exact: true }).first().click();
        await page.waitForURL(new RegExp(`${ids.route}(?:[/?#]|$)`));
      }
    },

    async verifyIsLoaded() {
      await assertions.expectElementVisible(header);
      await assertions.expectElementVisible(headerTitle);
      await assertions.expectElementVisible(search);
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
        await assertions.expectElementVisible(items.first());
      }
    },

    async searchFor(term) {
      await actions.fill(searchInput, term);
    },

    async clearSearch() {
      await actions.clear(searchInput);
    },

    async expectSearchValue(term) {
      await assertions.expectToHaveValue(searchInput, term);
    },
  };

  return api;
}
