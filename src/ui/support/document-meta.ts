import { expect, type Page } from '@playwright/test';

export type DocumentMeta = Readonly<{
  title: string;
  description: string;
}>;

export async function expectDocumentMeta(page: Page, expected: DocumentMeta): Promise<void> {
  await expect(page).toHaveTitle(expected.title);
  await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', expected.description);
}
