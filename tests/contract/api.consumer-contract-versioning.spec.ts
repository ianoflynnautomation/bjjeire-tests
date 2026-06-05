import { test, expect } from '@api/fixtures';
import { loadOpenApiContract } from '@api/support/api/contracts/openapi-contract';
import { API_ROUTES, rawRequest } from '@api/support/api';
import { consumerReadEndpoints } from './support/consumer-contract-cases';

test.describe('BjjEire API consumer contract — versioning', { tag: ['@api', '@contract'] }, () => {
  test('all consumer endpoints target v1', () => {
    for (const [, path] of consumerReadEndpoints) {
      expect(path, `Consumer endpoint '${path}' should be v1`).toMatch(/^\/api\/v1\//);
    }
  });

  test('all OpenAPI document paths are v1', async ({ apiClient }) => {
    const contract = await loadOpenApiContract(apiClient);
    const paths = Object.keys(contract.paths);

    expect(paths.length).toBeGreaterThan(0);
    for (const path of paths) {
      expect(path, `OpenAPI path '${path}' should be v1`).toMatch(/^\/api\/v1\//);
    }
  });

  test('v1 read endpoints return 200', async ({ apiClient }) => {
    const defaultReadEndpoints = consumerReadEndpoints.filter(([, path]) => path !== API_ROUTES.bjjEvents);
    for (const [method, path] of defaultReadEndpoints) {
      const response = await rawRequest(apiClient, method, path);
      expect(response.status(), `${method} ${path} should return 200`).toBe(200);
    }
  });

  test('non-existent v2 endpoint returns 404', async ({ apiClient }) => {
    const response = await rawRequest(apiClient, 'GET', API_ROUTES.gymsV2);
    expect(response.status()).toBe(404);
  });
});
