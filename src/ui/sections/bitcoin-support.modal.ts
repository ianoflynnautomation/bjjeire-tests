import { expect, type Page } from '@playwright/test';

export const SUPPORT_MODAL_COPY = {
  title: 'Support BJJ Eire',
} as const;

const TEST_IDS = {
  closeButton: 'support-modal-close-button',
  content: 'support-modal-content',
  overlay: 'support-modal-overlay',
  qrCode: 'support-modal-qr-code',
  title: 'support-modal-title',
  warning: 'support-modal-warning',
} as const;

const overlay = (page: Page) => page.getByTestId(TEST_IDS.overlay);

export async function expectSupportModalOpen(page: Page): Promise<void> {
  await expect(page.getByTestId(TEST_IDS.content)).toBeVisible();
  await expect(page.getByTestId(TEST_IDS.title)).toHaveText(SUPPORT_MODAL_COPY.title);
  await expect(page.getByTestId(TEST_IDS.qrCode)).toBeVisible();
  await expect(page.getByTestId(TEST_IDS.warning)).toBeVisible();
}

export async function expectSupportModalClosed(page: Page): Promise<void> {
  await expect(overlay(page)).toBeHidden();
}

export async function closeSupportModal(page: Page): Promise<void> {
  await page.getByTestId(TEST_IDS.closeButton).click();
}

export async function dismissSupportModalWithEscape(page: Page): Promise<void> {
  await page.keyboard.press('Escape');
}
