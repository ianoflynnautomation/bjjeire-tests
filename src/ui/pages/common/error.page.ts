import { expect, type Page } from '@playwright/test';

export const ERROR = {
  title: 'error-state-title',
  messageLine1: 'error-state-message-line1',
  button: 'error-state-button',
} as const;

export const ERROR_TITLE = 'Error Loading Data';

export const NETWORK_ERROR_MESSAGE =
  'Could not connect to the server. Please check your internet connection and try again.';

export const SERVER_ERROR_MESSAGE = 'Request failed with status code 500';

export async function expectNetworkError(page: Page): Promise<void> {
  await expect(page.getByTestId(ERROR.title)).toHaveText(ERROR_TITLE);
  await expect(page.getByTestId(ERROR.messageLine1)).toHaveText(NETWORK_ERROR_MESSAGE);
}

export async function expectServerError(page: Page): Promise<void> {
  await expect(page.getByTestId(ERROR.title)).toHaveText(ERROR_TITLE);
  await expect(page.getByTestId(ERROR.messageLine1)).toHaveText(SERVER_ERROR_MESSAGE);
}
