import { test } from '@shared/fixtures';
import { expectApi, featureFlagMapSchema, rawRequest } from '@api/support/api';

test.describe('Feature flags API Acceptance', { tag: ['@feature-flags', '@smoke', '@api'] }, () => {
  test(
    'GET /api/v1/FeatureFlag returns a { [name]: bool } map',
    { tag: ['@smoke', '@acceptance'] },
    async ({ apiClient }) => {
      const response = await rawRequest(apiClient, 'GET', '/api/v1/FeatureFlag');
      await expectApi(response).status(200).contentType('application/json').body(featureFlagMapSchema);
    },
  );
});
