import { test } from '@fixtures/base';
import { expectApi, featureFlagMapSchema } from '@lib/api';

test.describe('Feature flags API @feature-flags @smoke @api', () => {
  test('GET /api/FeatureFlag returns a { [name]: bool } map @smoke', async ({ apiClient }) => {
    const response = await apiClient.get('/api/FeatureFlag');
    const flags = await expectApi(response).status(200).contentType('application/json').body(featureFlagMapSchema);

    for (const [name, value] of Object.entries(flags)) {
      test.expect(typeof name, `flag '${name}' name is not a string`).toBe('string');
      test.expect(typeof value, `flag '${name}' value is not boolean`).toBe('boolean');
    }
  });
});
