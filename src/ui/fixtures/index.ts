import { test as shared, expect } from '@shared/fixtures';
import { clearPage, setPage } from '@ui/support/ui/page-context';

// `void` is the canonical Playwright pattern for setup-only fixtures.
// eslint-disable-next-line @typescript-eslint/no-invalid-void-type
type UiFixtures = { _pageContext: void };

export const test = shared.extend<UiFixtures>({
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
