import { test as shared, expect } from '@shared/fixtures';
import { clearPage, setPage } from '@ui/support/page-context';

type SetupFixture = void;
type UiFixtures = { _pageContext: SetupFixture; _featureFlagOverrides: SetupFixture };

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
