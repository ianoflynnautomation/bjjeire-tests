import { test as shared, expect } from '@shared/fixtures';
import { clearPage, setPage } from '@ui/support/ui/page-context';

const TEST_FLAG_OVERRIDES = {
  BjjEvents: true,
  Gyms: true,
  Competitions: true,
  Stores: true,
} as const;

const TEST_OVERRIDES_GLOBAL = '__BJJEIRE_TEST_FLAG_OVERRIDES__';

type SetupFixture = void;
type UiFixtures = { _pageContext: SetupFixture; _featureFlagOverrides: SetupFixture };

export const test = shared.extend<UiFixtures>({
  _featureFlagOverrides: [
    async ({ page }, use) => {
      await page.addInitScript(
        ({ key, value }) => {
          Object.assign(window, { [key]: value });
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
