import { expect, type APIRequestContext, type APIResponse } from '@playwright/test';

export type RateLimitProbeResult = Readonly<{
  responses: readonly APIResponse[];
  firstRejection?: APIResponse;
}>;

export async function probeUntilRateLimited(
  request: APIRequestContext,
  path: string,
  { maxAttempts = 30 }: { maxAttempts?: number } = {},
): Promise<RateLimitProbeResult> {
  const responses: APIResponse[] = [];
  for (let i = 0; i < maxAttempts; i += 1) {
    const response = await request.get(path, { failOnStatusCode: false });
    responses.push(response);
    if (response.status() === 429) {
      return { responses, firstRejection: response };
    }
  }
  return { responses };
}

export function expectRateLimitResponse(response: APIResponse): void {
  expect(response.status()).toBe(429);

  const headers = response.headers();
  expect(headers['retry-after'], 'Retry-After header missing').toBeDefined();
  expect(headers['x-ratelimit-limit'], 'X-RateLimit-Limit header missing').toBeDefined();
  expect(headers['x-ratelimit-remaining']).toBe('0');
  expect(headers['x-ratelimit-reset'], 'X-RateLimit-Reset header missing').toBeDefined();
  expect(headers['content-type']).toContain('application/problem+json');
}
