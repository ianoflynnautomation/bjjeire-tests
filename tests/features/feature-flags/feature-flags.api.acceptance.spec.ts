import { test } from '@shared/fixtures';
import { expectApi, featureFlagMapSchema, rawRequest } from '@api/support/api';

test.describe('Feature flags API Acceptance @feature-flags @smoke @api', () => {
  test('GET /api/FeatureFlag returns a { [name]: bool } map @smoke @acceptance', async ({ apiClient }) => {
    const response = await rawRequest(apiClient, 'GET', '/api/FeatureFlag');
    const flags = await expectApi(response).status(200).contentType('application/json').body(featureFlagMapSchema);

    for (const [name, value] of Object.entries(flags)) {
      test.expect(typeof name, `flag '${name}' name is not a string`).toBe('string');
      test.expect(typeof value, `flag '${name}' value is not boolean`).toBe('boolean');
    }
  });
});
