import { test } from '@api/fixtures';
import { API_ROUTES, expectProblem, ProblemType } from '@api/support';
import { env } from '@shared/config';
import { squash } from '@squash/annotations';

test.use({ requestAuth: 'none' });

test.describe('API authorization acceptance', { tag: ['@auth', '@api', '@squash'] }, () => {
  test(
    'client should be rejected when calling a protected environment without a bearer token',
    {
      tag: ['@acceptance'],
      annotation: squash({ weight: 'high', status: 'approved', nature: 'security', type: 'regression' }),
    },
    async ({ request }) => {
      await test.step('Given an environment that enforces API authorization', () => {
        test.skip(!env.apiAuth.required, 'this environment does not enforce API authorization');
      });

      const response = await test.step('When a client requests the gym directory without a bearer token', () =>
        request.get(API_ROUTES.gyms, { params: { page: 1, pageSize: 1 } }));

      await test.step('Then the request is rejected as unauthorized', async () => {
        await expectProblem(response, 401, ProblemType.Unauthorized);
      });
    },
  );
});
