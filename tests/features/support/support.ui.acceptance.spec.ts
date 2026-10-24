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
      await gotoAppShell(page, '/');
      await headerSection.clickSupportButton();
      await supportModal.expectOpen();
    },
  );

  test(
    'visitor should be able to close the support modal',
    {
      tag: '@acceptance',
      annotation: squash({ weight: 'medium', status: 'approved', nature: 'functional', type: 'regression' }),
    },
    async ({ page, headerSection, supportModal }) => {
      await gotoAppShell(page, '/');
      await headerSection.clickSupportButton();
      await supportModal.close();
      await supportModal.expectClosed();
    },
  );

  test(
    'visitor should be able to dismiss the support modal with Escape',
    {
      tag: '@acceptance',
      annotation: squash({ weight: 'medium', status: 'approved', nature: 'functional', type: 'regression' }),
    },
    async ({ page, headerSection, supportModal }) => {
      await gotoAppShell(page, '/');
      await headerSection.clickSupportButton();
      await supportModal.dismissWithEscape();
      await supportModal.expectClosed();
    },
  );
});
