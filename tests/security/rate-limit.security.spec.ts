import { test, expect } from '@api/fixtures';
import { API_ROUTES } from '@api/support';
import { expectRateLimitResponse, probeUntilRateLimited } from './helpers/rate-limit';
import { expectNoSensitiveLeakage } from './helpers/leakage';
import { expectRateLimitProblemDetails } from './helpers/rate-limit-body';

test.describe.configure({ mode: 'serial' });

test.describe('Rate limiting', { tag: ['@security', '@regression', '@rate-limit'] }, () => {
  test('public endpoint enforces 429 with ProblemDetails and rate-limit headers', async ({ apiClient }) => {
    const { firstRejection, responses } = await probeUntilRateLimited(apiClient, API_ROUTES.featureFlags, {
      maxAttempts: 40,
    });

    expect(
      firstRejection,
      `no 429 observed in ${responses.length} attempts — rate limit may be disabled`,
    ).toBeDefined();
    if (!firstRejection) return;

    expectRateLimitResponse(firstRejection);
    await expectRateLimitProblemDetails(firstRejection);
  });

  test('rate limit ProblemDetails does not leak sensitive info', async ({ apiClient }) => {
    const { firstRejection, responses } = await probeUntilRateLimited(apiClient, API_ROUTES.featureFlags, {
      maxAttempts: 40,
    });

    expect(firstRejection, `no 429 observed in ${responses.length} attempts`).toBeDefined();
    if (!firstRejection) return;

    const body = await firstRejection.text();
    expectNoSensitiveLeakage(body, 'rate-limit response');
  });
});
