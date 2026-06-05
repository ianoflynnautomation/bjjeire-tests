import { test as base, expect } from '@playwright/test';
import { clearPage, setPage } from '@ui/contexts/page-context';

type SetupFixture = void;
type UiFixtures = { _pageContext: SetupFixture };

export const test = base.extend<UiFixtures>({
  _pageContext: [
    async ({ page }, use) => {
      setPage(page);
      try {
        await use();
      } finally {
        clearPage();
      }
    },
    { auto: true },
  ],
});

export { expect };
