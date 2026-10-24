import { expect, test } from '@playwright/test';
import type { RetryPolicy } from '../infrastructure/config';
import { RetryingSquashClient, type RetryTiming } from '../infrastructure/retrying-squash-client';
import {
  SquashApiError,
  SquashNetworkError,
  type SquashClient,
  type SquashRequest,
} from '../infrastructure/squash-client';
import { RecordingLogger } from './fakes';

const POLICY: RetryPolicy = { maxAttempts: 4, baseDelayMs: 100, maxDelayMs: 1000 };
const GET: SquashRequest = { method: 'GET', path: '/test-cases/1' };
const POST: SquashRequest = { method: 'POST', path: '/test-cases', body: {} };
const RETRY_AFTER_MS = 700;
const OK = { id: 1 };

/** Fails with the queued errors in order, then succeeds. */
class FlakyClient implements SquashClient {
  calls = 0;

  constructor(private readonly failures: Error[]) {}

  send(): Promise<unknown> {
    this.calls++;
    const failure = this.failures.shift();
    return failure === undefined ? Promise.resolve(OK) : Promise.reject(failure);
  }
}

function setup(failures: Error[]): { inner: FlakyClient; client: RetryingSquashClient; delays: number[] } {
  const delays: number[] = [];
  // random() = 1 removes the jitter, so delays are exact.
  const timing: RetryTiming = {
    sleep: ms => {
      delays.push(ms);
      return Promise.resolve();
    },
    random: () => 1,
  };
  const inner = new FlakyClient(failures);
  return { inner, client: new RetryingSquashClient(inner, new RecordingLogger(), POLICY, timing), delays };
}

const apiError = (request: SquashRequest, status: number, retryAfterMs?: number): SquashApiError =>
  new SquashApiError(request, status, '', retryAfterMs);

test.describe('RetryingSquashClient', { tag: ['@unit'] }, () => {
  test('retries a GET through 503s with exponential backoff, then returns the body', async () => {
    const { inner, client, delays } = setup([apiError(GET, 503), apiError(GET, 503), apiError(GET, 503)]);

    await expect(client.send(GET)).resolves.toEqual(OK);
    expect(inner.calls).toBe(POLICY.maxAttempts);
    expect(delays).toEqual([100, 200, 400]);
  });

  test('gives up after maxAttempts and rethrows the last error', async () => {
    const failures = Array.from({ length: POLICY.maxAttempts }, () => apiError(GET, 502));
    const { inner, client } = setup(failures);

    await expect(client.send(GET)).rejects.toBeInstanceOf(SquashApiError);
    expect(inner.calls).toBe(POLICY.maxAttempts);
  });

  test('never retries a POST after a 500, because the server may have created the resource', async () => {
    const { inner, client } = setup([apiError(POST, 500)]);

    await expect(client.send(POST)).rejects.toBeInstanceOf(SquashApiError);
    expect(inner.calls).toBe(1);
  });

  test('retries a POST rejected with 429 and waits at least Retry-After', async () => {
    const { inner, client, delays } = setup([apiError(POST, 429, RETRY_AFTER_MS)]);

    await expect(client.send(POST)).resolves.toEqual(OK);
    expect(inner.calls).toBe(2);
    expect(delays).toEqual([RETRY_AFTER_MS]);
  });

  test('retries a POST whose connection was refused, but not one that timed out', async () => {
    const refused = new SquashNetworkError(POST, new TypeError('fetch failed', { cause: { code: 'ECONNREFUSED' } }));
    const timedOut = new SquashNetworkError(POST, new DOMException('timed out', 'TimeoutError'));

    await expect(setup([refused]).client.send(POST)).resolves.toEqual(OK);
    await expect(setup([timedOut]).client.send(POST)).rejects.toBe(timedOut);
  });

  test('does not retry client errors such as 400 or 401', async () => {
    const { inner, client } = setup([apiError(GET, 401)]);

    await expect(client.send(GET)).rejects.toBeInstanceOf(SquashApiError);
    expect(inner.calls).toBe(1);
  });
});
