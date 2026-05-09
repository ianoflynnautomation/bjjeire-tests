import { expect, type APIResponse } from '@playwright/test';

/**
 * Asserts that error responses (4xx) never return `text/html` Content-Type.
 * Returning HTML on error risks browser-rendering of reflected/injected content.
 * No-op for 2xx/3xx responses.
 */
export function expectSafeErrorContentType(response: APIResponse): void {
  if (response.status() < 400) return;

  const contentType = response.headers()['content-type'] ?? '';
  expect(contentType, `error ${response.status()} must not return text/html`).not.toMatch(/text\/html/i);
}
