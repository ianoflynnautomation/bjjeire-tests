import { test, templateTestConfig } from './fixtures';
import { squash } from '@squash/annotations';

test.use(templateTestConfig);

// Seeded DTOs live in `./seeded.ts`. Route mocks live in `./mocks.ts` and are
// exposed through `./fixtures`. Static JSON bodies stay in `./testdata/`.

test.describe('Template UI acceptance', { tag: ['@template', '@ui', '@desktop', '@squash'] }, () => {
  test(
    'visitor should see the feature screen when opening the feature',
    {
      tag: ['@smoke', '@acceptance'],
      annotation: squash({ weight: 'high', status: 'approved', nature: 'functional', type: 'regression' }),
    },
    async ({ templatePage }) => {
      await test.step('When a visitor opens the feature', async () => {
        await templatePage.navigate();
      });

      await test.step('Then the feature screen is displayed', async () => {
        await templatePage.verifyIsLoaded();
      });
    },
  );
});
