import { test, expect } from '@api/fixtures';
import { API_ROUTES } from '@api/support';
import { env } from '@shared/config';

const UNAUTHORIZED = 401;

// This file is the one place that deliberately calls the API unauthenticated.
test.use({ requestAuth: 'none' });

test.describe('API authorization acceptance', { tag: ['@auth', '@api'] }, () => {
  test(
    'Given a protected environment, when a client calls without a bearer token, then the request is rejected',
    { tag: '@acceptance' },
    async ({ request }) => {
      test.skip(!env.apiAuth.required, 'this environment does not enforce API authorization');

      const response = await request.get(API_ROUTES.gyms, { params: { page: 1, pageSize: 1 } });

      expect(response.status()).toBe(UNAUTHORIZED);
    },
  );
});
