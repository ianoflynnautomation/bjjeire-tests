import { test as shared, expect } from '@shared/fixtures';
import { clearPage, setPage } from '@ui/support/ui/page-context';

const TEST_FLAG_OVERRIDES = {
  BjjEvents: true,
  Gyms: true,
  Competitions: true,
  Stores: true,
} as const;

const TEST_OVERRIDES_GLOBAL = '__BJJEIRE_TEST_FLAG_OVERRIDES__';

// `void` is the canonical Playwright pattern for setup-only fixtures.
// eslint-disable-next-line @typescript-eslint/no-invalid-void-type
type UiFixtures = { _pageContext: void; _featureFlagOverrides: void };

export const test = shared.extend<UiFixtures>({
  _featureFlagOverrides: [
    async ({ page }, use) => {
      await page.addInitScript(
        ({ key, value }) => {
          (window as unknown as Record<string, unknown>)[key] = value;
        },
        { key: TEST_OVERRIDES_GLOBAL, value: TEST_FLAG_OVERRIDES },
      );
      await use();
    },
    { auto: true },
  ],
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
