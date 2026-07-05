import { test, expect } from '@api/fixtures';
import { API_ROUTES } from '@api/support';
import { expectRateLimitResponse, probeUntilRateLimited } from './helpers/rate-limit';
import { expectNoSensitiveLeakage } from './helpers/leakage';

test.describe('Rate limiting', { tag: ['@security', '@regression', '@rate-limit'] }, () => {
  test('public endpoint enforces 429 with rate-limit headers and no leakage', async ({ apiClient }) => {
    const { firstRejection, responses } = await probeUntilRateLimited(apiClient, API_ROUTES.featureFlags, {
      maxAttempts: 40,
    });

    expect(
      firstRejection,
      `no 429 observed in ${responses.length} attempts — rate limit may be disabled`,
    ).toBeDefined();
    if (!firstRejection) return;

    expectRateLimitResponse(firstRejection);
    expectNoSensitiveLeakage(await firstRejection.text(), 'rate-limit response');
  });
});
