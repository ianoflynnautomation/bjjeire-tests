import { test, expect } from '@api/fixtures';
import { API_ROUTES, apiRequest } from '@api/support';
import { env } from '@shared/config';
import { expectOriginRejected, preflight } from './helpers/cors';

const DISALLOWED_ORIGIN = 'https://evil.example';
const TRUSTED_ORIGIN = env.baseUrl;

test.describe('CORS', { tag: ['@security', '@regression', '@cors'] }, () => {
  test(`preflight from '${DISALLOWED_ORIGIN}' is not allowed`, async ({ apiClient }) => {
    const response = await preflight(apiClient, API_ROUTES.gyms, { origin: DISALLOWED_ORIGIN, method: 'GET' });
    expectOriginRejected(response, DISALLOWED_ORIGIN);
  });

  test('wildcard Access-Control-Allow-Origin is never used', async ({ apiClient }) => {
    const response = await apiRequest(apiClient, 'GET', API_ROUTES.gyms, { headers: { Origin: TRUSTED_ORIGIN } });
    expect(response.headers()['access-control-allow-origin']).not.toBe('*');
  });
});
