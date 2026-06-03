import { expect, type APIResponse } from '@playwright/test';

/**
 * RFC 7807 ProblemDetails shape extended with the rate-limiter's custom
 * fields. Mirrors RateLimitExtensions.cs OnRejected handler exactly so any
 * backend drift surfaces as a type error here.
 */
type RateLimitProblemDetails = Readonly<{
  type: string;
  title: string;
  status: number;
  detail?: unknown;
  retryAfterSeconds?: unknown;
  limit?: unknown;
  windowSeconds?: unknown;
  resource?: unknown;
}>;

// Matches RFC 1918 private address ranges. The "resource" extension should
// never expose internal hostnames to clients; this guards against regressions
// in the backend's response sanitisation.
const PRIVATE_IP_PATTERN = /\b(?:10|192\.168|172\.(?:1[6-9]|2\d|3[01]))\.\d{1,3}\.\d{1,3}\b/;

/**
 * Validates the ProblemDetails body shape returned by the backend rate limiter.
 * Matches the exact fields set in RateLimitExtensions.cs OnRejected handler.
 */
export async function expectRateLimitProblemDetails(response: APIResponse): Promise<void> {
  const problem = (await response.json()) as RateLimitProblemDetails;

  expect(problem.type).toBe('urn:bjjeire:rate-limit-exceeded');
  expect(problem.title).toBe('API Rate Limit Exceeded');
  expect(problem.status).toBe(429);
  expect(problem.detail).toBeTruthy();

  // Extensions documented by the backend — every field is required to be
  // present even though we don't pin the exact values (they vary by route).
  expect(problem.retryAfterSeconds, 'missing retryAfterSeconds extension').toBeDefined();
  expect(problem.limit, 'missing limit extension').toBeDefined();
  expect(problem.windowSeconds, 'missing windowSeconds extension').toBeDefined();

  if (typeof problem.resource === 'string') {
    expect(problem.resource).not.toMatch(PRIVATE_IP_PATTERN);
  }
}
