import { test } from '@api/fixtures/app-fixtures';
import { expectApi, featureFlagMapSchema } from '@api/support/api';

test.describe('Feature flags API Acceptance @feature-flags @smoke @api', () => {
  test('GET /api/FeatureFlag returns a { [name]: bool } map @smoke @acceptance', async ({ request }) => {
    const response = await request.get('/api/FeatureFlag', { failOnStatusCode: false });
    const flags = await expectApi(response).status(200).contentType('application/json').body(featureFlagMapSchema);

    for (const [name, value] of Object.entries(flags)) {
      test.expect(typeof name, `flag '${name}' name is not a string`).toBe('string');
      test.expect(typeof value, `flag '${name}' value is not boolean`).toBe('boolean');
    }
  });
});
