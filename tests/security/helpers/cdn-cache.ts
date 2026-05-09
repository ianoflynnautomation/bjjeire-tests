import { expect, type APIResponse } from '@playwright/test';

const ERROR_THRESHOLD = 400;

/**
 * Asserts that an error response (>=400) was not served from CDN cache.
 * A `cf-cache-status: HIT` on an error response means the CDN is caching error
 * pages, which risks serving stale or reflected content. No-op for 2xx/3xx.
 */
export function expectNoCdnCacheHit(response: APIResponse): void {
  if (response.status() < ERROR_THRESHOLD) return;

  const cfCacheStatus = response.headers()['cf-cache-status'] ?? '';
  expect(
    cfCacheStatus.toUpperCase(),
    `error ${response.status()} was served from CDN cache (cf-cache-status: ${cfCacheStatus})`,
  ).not.toBe('HIT');
}

const SAFE_CACHE_DIRECTIVE = /no-store|no-cache|private/i;

export function expectNonCacheableApiResponse(response: APIResponse, route: string): void {
  const cacheControl = response.headers()['cache-control'] ?? '';
  expect(
    SAFE_CACHE_DIRECTIVE.test(cacheControl) || cacheControl === '',
    `GET ${route} cache-control '${cacheControl}' may cache sensitive API data on CDN`,
  ).toBe(true);
}
