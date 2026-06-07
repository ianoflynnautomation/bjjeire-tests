import { test } from '@api/fixtures';
import { apiRequest } from '@api/support';
import { WRITE_ENDPOINTS } from './helpers/routes';
import { expectNoSensitiveLeakage } from './helpers/leakage';
import { expectReadOnlyResponse } from './helpers/read-only-mode';

test.describe('Read-only mode enforcement', { tag: ['@security', '@regression', '@authz'] }, () => {
  for (const { method, path } of WRITE_ENDPOINTS) {
    test(`${method} ${path} is rejected with 405 ProblemDetails`, async ({ apiClient }) => {
      const response = await apiRequest(apiClient, method, path, { data: {} });

      await expectReadOnlyResponse(response);
      expectNoSensitiveLeakage(await response.text(), `${method} ${path}`);
    });
  }
});
