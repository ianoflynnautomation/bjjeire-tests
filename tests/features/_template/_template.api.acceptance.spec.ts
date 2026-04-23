import { test } from '@shared/fixtures';

test.describe('Template API Acceptance @template @api', () => {
  test('exercises the apiClient fixture only @smoke @acceptance', async ({ apiClient }) => {
    test.expect(apiClient).toBeTruthy();
  });
});
