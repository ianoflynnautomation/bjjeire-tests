import { test, expect } from '@shared/fixtures';
import { API_ROUTES, rawRequest } from '@api/support/api';
import { env } from '@shared/config';
import { expectCredentialsDisallowed, expectMethodNotAllowed, expectOriginRejected, preflight } from './helpers/cors';

const DISALLOWED_ORIGINS: readonly string[] = ['https://evil.example', 'https://attacker.tld', 'null'];

const TRUSTED_ORIGIN = env.baseUrl;

test.describe('CORS', { tag: ['@security', '@regression', '@cors'] }, () => {
  for (const origin of DISALLOWED_ORIGINS) {
    test(`preflight from '${origin}' is not allowed`, async ({ apiClient }) => {
      const response = await preflight(apiClient, API_ROUTES.gyms, { origin, method: 'GET' });
      expectOriginRejected(response, origin);
    });
  }

  test('preflight for disallowed method (PATCH) is not advertised', async ({ apiClient }) => {
    const response = await preflight(apiClient, API_ROUTES.gyms, { origin: TRUSTED_ORIGIN, method: 'PATCH' });
    expectMethodNotAllowed(response, 'PATCH');
  });

  test('no endpoint exposes Access-Control-Allow-Credentials: true', async ({ apiClient }) => {
    for (const path of [API_ROUTES.gyms, API_ROUTES.featureFlags]) {
      const response = await rawRequest(apiClient, 'GET', path, { headers: { Origin: TRUSTED_ORIGIN } });
      expectCredentialsDisallowed(response);
    }
  });

  test('wildcard Access-Control-Allow-Origin is never used', async ({ apiClient }) => {
    const response = await rawRequest(apiClient, 'GET', API_ROUTES.gyms, { headers: { Origin: TRUSTED_ORIGIN } });
    expect(response.headers()['access-control-allow-origin']).not.toBe('*');
  });

  test('only rate-limit and retry-after headers are exposed to cross-origin clients', async ({ apiClient }) => {
    const response = await preflight(apiClient, API_ROUTES.gyms, { origin: TRUSTED_ORIGIN, method: 'GET' });
    const exposedRaw = response.headers()['access-control-expose-headers'] ?? '';
    const exposed = exposedRaw.toLowerCase();

    for (const expected of ['x-ratelimit-limit', 'x-ratelimit-remaining', 'x-ratelimit-reset', 'retry-after']) {
      expect(exposed, `expected exposed header: ${expected}`).toContain(expected);
    }

    expect(exposed).not.toContain('set-cookie');
    expect(exposed).not.toContain('authorization');
  });
});
