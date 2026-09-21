import { test } from '@ui/fixtures';
import { goto } from '@ui/support';

test.describe('Support UI acceptance', { tag: ['@support', '@ui', '@desktop'] }, () => {
  test(
    'Given a visitor, when they select the support option, then the bitcoin support modal is displayed',
    { tag: '@acceptance' },
    async ({ page, headerSection, supportModal }) => {
      await goto(page, '/');
      await headerSection.clickSupportButton();
      await supportModal.expectOpen();
    },
  );

  test(
    'Given the support modal is open, when the visitor closes it, then the modal is dismissed',
    { tag: '@acceptance' },
    async ({ page, headerSection, supportModal }) => {
      await goto(page, '/');
      await headerSection.clickSupportButton();
      await supportModal.close();
      await supportModal.expectClosed();
    },
  );

  test(
    'Given the support modal is open, when the visitor presses Escape, then the modal is dismissed',
    { tag: '@acceptance' },
    async ({ page, headerSection, supportModal }) => {
      await goto(page, '/');
      await headerSection.clickSupportButton();
      await supportModal.dismissWithEscape();
      await supportModal.expectClosed();
    },
  );
});
