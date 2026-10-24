import { test } from '@ui/fixtures';
import { gotoAppShell } from '@ui/support';
import { squash } from '@squash/annotations';

test.describe('Support UI acceptance', { tag: ['@support', '@ui', '@desktop', '@squash'] }, () => {
  test(
    'visitor should see the bitcoin support modal after selecting the support option',
    {
      tag: '@acceptance',
      annotation: squash({ weight: 'medium', status: 'approved', nature: 'functional', type: 'regression' }),
    },
    async ({ page, headerSection, supportModal }) => {
      await test.step('When a visitor opens the site', async () => {
        await gotoAppShell(page, '/');
      });

      await test.step('And the visitor selects support', async () => {
        await headerSection.clickSupportButton();
      });

      await test.step('Then the bitcoin support modal is open', async () => {
        await supportModal.expectOpen();
      });
    },
  );

  test(
    'visitor should be able to close the support modal',
    {
      tag: '@acceptance',
      annotation: squash({ weight: 'medium', status: 'approved', nature: 'functional', type: 'regression' }),
    },
    async ({ page, headerSection, supportModal }) => {
      await test.step('Given the support modal is open', async () => {
        await gotoAppShell(page, '/');
        await headerSection.clickSupportButton();
      });

      await test.step('When the visitor closes the modal', async () => {
        await supportModal.close();
      });

      await test.step('Then the support modal is closed', async () => {
        await supportModal.expectClosed();
      });
    },
  );

  test(
    'visitor should be able to dismiss the support modal with Escape',
    {
      tag: '@acceptance',
      annotation: squash({ weight: 'medium', status: 'approved', nature: 'functional', type: 'regression' }),
    },
    async ({ page, headerSection, supportModal }) => {
      await test.step('Given the support modal is open', async () => {
        await gotoAppShell(page, '/');
        await headerSection.clickSupportButton();
      });

      await test.step('When the visitor presses Escape', async () => {
        await supportModal.dismissWithEscape();
      });

      await test.step('Then the support modal is closed', async () => {
        await supportModal.expectClosed();
      });
    },
  );
});
