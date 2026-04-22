import { test } from '@api/fixtures/app-fixtures';

test.describe('Template API Acceptance @template @api', () => {
  test('exercises the request fixture only @smoke @acceptance', async ({ request }) => {
    test.expect(request).toBeTruthy();
  });
});
