import { expect, type APIResponse } from '@playwright/test';

/**
 * Validates the ProblemDetails body shape returned by the backend rate limiter.
 * Matches the exact fields set in RateLimitExtensions.cs OnRejected handler.
 */
export async function expectRateLimitProblemDetails(response: APIResponse): Promise<void> {
  const problem = (await response.json()) as Record<string, unknown>;

  expect(problem.type).toBe('urn:bjjeire:rate-limit-exceeded');
  expect(problem.title).toBe('API Rate Limit Exceeded');
  expect(problem.status).toBe(429);
  expect(problem.detail).toBeTruthy();

  // Backend exposes retryAfterSeconds, limit, windowSeconds, resource in extensions
  expect(problem.retryAfterSeconds, 'missing retryAfterSeconds extension').toBeDefined();
  expect(problem.limit, 'missing limit extension').toBeDefined();
  expect(problem.windowSeconds, 'missing windowSeconds extension').toBeDefined();

  // The "resource" extension should not contain internal hostnames
  if (typeof problem.resource === 'string') {
    expect(problem.resource).not.toMatch(/\b(?:10|192\.168|172\.(?:1[6-9]|2\d|3[01]))\.\d{1,3}\.\d{1,3}\b/);
  }
}
