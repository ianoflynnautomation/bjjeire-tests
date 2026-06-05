import { expect } from '@playwright/test';
import { test } from '@api/fixtures';
import { API_ROUTES, rawRequest } from '@api/support/api';
import { COLLECTION_ROUTES, PUBLIC_ROUTES } from './helpers/routes';
import { expectNoSensitiveLeakage } from './helpers/leakage';
import { expectHeaderProfile } from './helpers/security-headers';
import { expectNoCdnCacheHit, expectNonCacheableApiResponse } from './helpers/cdn-cache';

test.describe('Security headers', { tag: ['@security', '@regression', '@headers'] }, () => {
  for (const route of PUBLIC_ROUTES) {
    test(`GET ${route} returns the required header profile`, async ({ apiClient }) => {
      const response = await rawRequest(apiClient, 'GET', route);
      expectHeaderProfile(response);
    });
  }

  test('error responses also carry security headers', async ({ apiClient }) => {
    const response = await rawRequest(apiClient, 'GET', API_ROUTES.gyms, { params: { page: -1 } });
    expectHeaderProfile(response);
  });
});

test.describe('Cloudflare CDN security', { tag: ['@security', '@regression', '@cloudflare'] }, () => {
  for (const route of PUBLIC_ROUTES) {
    test(`GET ${route} has no-store or private cache directive`, async ({ apiClient }) => {
      const response = await rawRequest(apiClient, 'GET', route);
      expectNonCacheableApiResponse(response, route);
    });
  }

  for (const route of COLLECTION_ROUTES) {
    test(`GET ${route}?page=-1 error is not cacheable`, async ({ apiClient }) => {
      const response = await rawRequest(apiClient, 'GET', route, { params: { page: -1 } });
      expectNoCdnCacheHit(response);
      expectNoSensitiveLeakage(await response.text(), `error cache probe on ${route}`);
    });
  }

  test('Cloudflare does not leak cf-connecting-ip to clients', async ({ apiClient }) => {
    const response = await rawRequest(apiClient, 'GET', API_ROUTES.gyms);
    expect(response.headers()['cf-connecting-ip'], 'cf-connecting-ip leaked to client').toBeUndefined();
  });
});
