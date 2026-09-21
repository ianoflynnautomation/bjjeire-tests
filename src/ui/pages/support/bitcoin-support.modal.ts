import { expect, type Locator, type Page } from '@playwright/test';

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

export class SupportModal {
  constructor(private readonly page: Page) {}

  private get overlay(): Locator {
    return this.page.getByTestId(TEST_IDS.overlay);
  }

  async expectOpen(): Promise<void> {
    await expect(this.page.getByTestId(TEST_IDS.content)).toBeVisible();
    await expect(this.page.getByTestId(TEST_IDS.title)).toHaveText(SUPPORT_MODAL_COPY.title);
    await expect(this.page.getByTestId(TEST_IDS.qrCode)).toBeVisible();
    await expect(this.page.getByTestId(TEST_IDS.warning)).toBeVisible();
  }

  async expectClosed(): Promise<void> {
    await expect(this.overlay).toBeHidden();
  }

  async close(): Promise<void> {
    await this.page.getByTestId(TEST_IDS.closeButton).click();
  }

  async dismissWithEscape(): Promise<void> {
    await this.page.keyboard.press('Escape');
  }
}
