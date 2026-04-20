import { test } from '@core/fixtures/app-fixtures';

test.describe('Template API @template @api', () => {
  test('exercises the request fixture only @smoke', async ({ apiClient }) => {
    test.expect(apiClient).toBeTruthy();
  });
});
