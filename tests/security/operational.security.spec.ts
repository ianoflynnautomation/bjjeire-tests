import { test, expect } from '@api/fixtures';
import { API_ROUTES, apiRequest } from '@api/support';
import { expectNoSensitiveLeakage } from './helpers/leakage';
import { expectNoHealthCheckLeakage } from './helpers/health-check';

test.describe('Operational endpoints', { tag: ['@security', '@regression', '@data-exposure'] }, () => {
  test('/health is reachable and does not leak sensitive detail', async ({ apiClient }) => {
    const response = await apiRequest(apiClient, 'GET', API_ROUTES.health);
    expect([200, 503]).toContain(response.status());

    const body = await response.text();
    expectNoSensitiveLeakage(body, 'GET /health');
    expect(body).not.toMatch(/mongodb:\/\/\S+/i);
  });

  test('/health response does not expose internal service topology', async ({ apiClient }) => {
    const response = await apiRequest(apiClient, 'GET', API_ROUTES.health);
    const body = await response.text();
    expectNoHealthCheckLeakage(body);
  });

  test('/metrics is not publicly exposed', async ({ apiClient }) => {
    const response = await apiRequest(apiClient, 'GET', API_ROUTES.metrics);
    expect(
      [401, 403, 404].includes(response.status()),
      `Prometheus /metrics responded ${response.status()} unauthenticated — this leaks operational data. ` +
        `Gate it behind auth or restrict by IP.`,
    ).toBe(true);
  });

  test('OpenAPI spec is not exposed in staging', async ({ apiClient }) => {
    const response = await apiRequest(apiClient, 'GET', API_ROUTES.openApiV1);
    expect(
      [401, 403, 404].includes(response.status()),
      `OpenAPI spec exposed in staging (status ${response.status()}) — leaks full API schema. ` +
        `Only serve OpenAPI in Development/Docker environments.`,
    ).toBe(true);
  });

  test('Scalar API reference UI is not exposed in staging', async ({ apiClient }) => {
    const response = await apiRequest(apiClient, 'GET', API_ROUTES.scalarV1);
    expect(
      [401, 403, 404].includes(response.status()),
      `Scalar API UI exposed in staging (status ${response.status()}) — should only be available in Development/Docker.`,
    ).toBe(true);
  });
});
