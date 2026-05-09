import { expect, type APIResponse } from '@playwright/test';

const SERVER_ERROR_THRESHOLD = 500;
const GATED_STATUSES: readonly number[] = [401, 403, 404];

export function expectNoServerError(response: APIResponse, context?: string): void {
  const status = response.status();
  expect(status, `${context ?? 'response'} unexpectedly returned server error ${status}`).toBeLessThan(
    SERVER_ERROR_THRESHOLD,
  );
}

/**
 * Asserts that an operational/internal endpoint is not publicly reachable.
 * Accepts 401/403/404 — anything else (200, 5xx) means the endpoint is exposed
 * or is misbehaving in a way that leaks operational data.
 */
export function expectEndpointGated(response: APIResponse, label: string): void {
  const status = response.status();
  expect(
    GATED_STATUSES.includes(status),
    `${label} responded ${status} — expected one of [${GATED_STATUSES.join(', ')}] (gated/not-found).`,
  ).toBe(true);
}
