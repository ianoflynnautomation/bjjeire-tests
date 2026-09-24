import { test, templateTestConfig } from './fixtures';

test.use(templateTestConfig);

// Seeded DTOs live in `./seeded.ts`. Route mocks live in `./mocks.ts` and are
// exposed through `./fixtures`. Static JSON bodies stay in `./testdata/`.

test.describe('Template UI acceptance', { tag: ['@template', '@ui', '@desktop'] }, () => {
  test(
    'Given available feature data, when a visitor opens the feature, then the feature screen is displayed',
    { tag: ['@smoke', '@acceptance'] },
    async ({ templatePage }) => {
      await templatePage.navigate();
      await templatePage.verifyIsLoaded();
    },
  );
});
