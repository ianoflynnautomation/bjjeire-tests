import { test } from '@shared/fixtures';
import {
  API_ROUTES,
  expectApiBody,
  expectApiContentType,
  expectApiStatus,
  featureFlagMapSchema,
  rawRequest,
} from '@api/support/api';

test.describe('Feature flags API Acceptance', { tag: ['@feature-flags', '@smoke', '@api'] }, () => {
  test(
    'GET /api/v1/FeatureFlag returns a { [name]: bool } map',
    { tag: ['@smoke', '@acceptance'] },
    async ({ apiClient }) => {
      const response = await rawRequest(apiClient, 'GET', API_ROUTES.featureFlagsPascal);
      expectApiStatus(response, 200);
      expectApiContentType(response, 'application/json');
      await expectApiBody(response, featureFlagMapSchema);
    },
  );
});
