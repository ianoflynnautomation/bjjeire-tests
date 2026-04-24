import { test } from '@shared/fixtures';
import { expectApi, featureFlagMapSchema, rawRequest } from '@api/support/api';

test.describe('Feature flags API Acceptance @feature-flags @smoke @api', () => {
  test('GET /api/FeatureFlag returns a { [name]: bool } map @smoke @acceptance', async ({ apiClient }) => {
    const response = await rawRequest(apiClient, 'GET', '/api/FeatureFlag');
    await expectApi(response).status(200).contentType('application/json').body(featureFlagMapSchema);
  });
});
