import { test } from '@api/fixtures';
import { rawRequest } from '@api/support/api';
import { WRITE_ENDPOINTS } from './helpers/routes';
import { expectNoSensitiveLeakage } from './helpers/leakage';
import { expectReadOnlyResponse } from './helpers/read-only-mode';

test.describe('Read-only mode enforcement', { tag: ['@security', '@regression', '@authz'] }, () => {
  for (const { method, path } of WRITE_ENDPOINTS) {
    test(`${method} ${path} is rejected with 405 ProblemDetails`, async ({ apiClient }) => {
      const response = await rawRequest(apiClient, method, path, { data: {} });

      await expectReadOnlyResponse(response);
      expectNoSensitiveLeakage(await response.text(), `${method} ${path}`);
    });
  }
});
