import { test } from '@api/fixtures';
import { API_ROUTES, rawRequest, withRouteId } from '@api/support/api';
import { expectNoServerError } from './helpers/expectations';
import { expectNoSensitiveLeakage } from './helpers/leakage';
import { expectSafeErrorContentType } from './helpers/content-type';
import { COLLECTION_ROUTES } from './helpers/routes';

test.describe('Data exposure', { tag: ['@security', '@regression', '@data-exposure'] }, () => {
  for (const path of COLLECTION_ROUTES) {
    test(`GET ${path} response body is free of sensitive leakage`, async ({ apiClient }) => {
      const response = await rawRequest(apiClient, 'GET', path);
      const body = await response.text();
      expectNoSensitiveLeakage(body, `GET ${path}`);
    });
  }

  test('malformed query parameters do not leak internals', async ({ apiClient }) => {
    const context = 'GET /api/v1/gym with malformed params';
    const response = await rawRequest(apiClient, 'GET', API_ROUTES.gyms, {
      params: { page: -1, pageSize: 99999 },
    });

    expectNoServerError(response, context);
    expectSafeErrorContentType(response);

    const body = await response.text();
    expectNoSensitiveLeakage(body, context);
  });

  test('unknown id returns a clean error without leakage', async ({ apiClient }) => {
    const context = 'GET /api/v1/gym/{invalid}';
    const response = await rawRequest(apiClient, 'GET', withRouteId(API_ROUTES.gyms, 'not-a-real-id'));
    expectNoServerError(response, context);
    expectSafeErrorContentType(response);

    const body = await response.text();
    expectNoSensitiveLeakage(body, context);
  });
});
