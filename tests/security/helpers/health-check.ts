import { expect } from '@playwright/test';

/**
 * Validates that a health check JSON response does not expose internal service topology.
 * Matches the shape returned by HealthChecksExtension.cs:
 * { status, checks: [{ name, status, description, durationMs, tags }], totalDurationMs }
 */
export function expectNoHealthCheckLeakage(body: string): void {
  expect(body).not.toMatch(/mongodb:\/\/\S+/i);
  expect(body).not.toMatch(/\b(?:10|192\.168|172\.(?:1[6-9]|2\d|3[01]))\.\d{1,3}\.\d{1,3}\b/);
  expect(body).not.toMatch(/password|secret|key/i);
}
