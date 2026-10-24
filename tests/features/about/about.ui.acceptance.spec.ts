import { test, aboutTestConfig } from './fixtures';
import { squash } from '@squash/annotations';

test.use(aboutTestConfig);

test.describe('About UI acceptance', { tag: ['@about', '@ui', '@desktop', '@squash'] }, () => {
  test(
    'visitor should see the About page when opening it',
    {
      tag: ['@smoke', '@acceptance'],
      annotation: squash({ weight: 'high', status: 'approved', nature: 'functional', type: 'regression' }),
    },
    async ({ aboutPage }) => {
      await test.step('When a visitor opens the About page', async () => {
        await aboutPage.navigate();
      });

      await test.step('Then the About page is displayed', async () => {
        await aboutPage.verifyIsLoaded();
      });
    },
  );
});
