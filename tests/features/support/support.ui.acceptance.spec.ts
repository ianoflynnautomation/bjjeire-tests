import { test } from '@ui/fixtures';
import { clickSupportButton } from '@ui/sections/header.section';
import {
  closeSupportModal,
  dismissSupportModalWithEscape,
  expectSupportModalClosed,
  expectSupportModalOpen,
} from '@ui/sections/bitcoin-support.modal';
import { goto } from '@ui/support';

test.describe('Support UI acceptance', { tag: ['@support', '@ui', '@desktop'] }, () => {
  test(
    'Given a visitor, when they select the support option, then the bitcoin support modal is displayed',
    { tag: '@acceptance' },
    async ({ page }) => {
      await goto(page, '/');
      await clickSupportButton(page);
      await expectSupportModalOpen(page);
    },
  );

  test(
    'Given the support modal is open, when the visitor closes it, then the modal is dismissed',
    { tag: '@acceptance' },
    async ({ page }) => {
      await goto(page, '/');
      await clickSupportButton(page);
      await closeSupportModal(page);
      await expectSupportModalClosed(page);
    },
  );

  test(
    'Given the support modal is open, when the visitor presses Escape, then the modal is dismissed',
    { tag: '@acceptance' },
    async ({ page }) => {
      await goto(page, '/');
      await clickSupportButton(page);
      await dismissSupportModalWithEscape(page);
      await expectSupportModalClosed(page);
    },
  );
});
