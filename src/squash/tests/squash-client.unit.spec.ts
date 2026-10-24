import { expect, test } from '@playwright/test';
import {
  FetchSquashClient,
  SquashApiError,
  SquashNetworkError,
  SquashUnexpectedResponseError,
} from '../infrastructure/squash-client';

const BASE_URL = 'http://squash.test/squash/';
const TIMEOUT_MS = 1000;
const RETRY_AFTER_SECONDS = 3;
const RETRY_AFTER_MS = 3000;

type Call = Readonly<{ url: string; init: RequestInit }>;

/** A fetch that records each call and answers with the given response or error. */
function fakeFetch(answer: Response | Error): { fetchImpl: typeof fetch; calls: Call[] } {
  const calls: Call[] = [];
  const fetchImpl = (input: string | URL | Request, init: RequestInit = {}): Promise<Response> => {
    calls.push({ url: input instanceof Request ? input.url : input.toString(), init });
    return answer instanceof Error ? Promise.reject(answer) : Promise.resolve(answer);
  };
  return { fetchImpl: fetchImpl, calls };
}

function client(answer: Response | Error): { squash: FetchSquashClient; calls: Call[] } {
  const { fetchImpl, calls } = fakeFetch(answer);
  const squash = new FetchSquashClient({ baseUrl: BASE_URL, token: 'api-token', timeoutMs: TIMEOUT_MS }, fetchImpl);
  return { squash, calls };
}

test.describe('FetchSquashClient', { tag: ['@unit'] }, () => {
  test('sends JSON with auth to the REST root and returns the parsed body', async () => {
    const { squash, calls } = client(Response.json({ id: 1 }, { status: 201 }));

    const body = await squash.send({ method: 'POST', path: '/test-cases', query: { page: 0 }, body: { name: 'x' } });

    expect(body).toEqual({ id: 1 });
    expect(calls).toHaveLength(1);
    expect(calls[0]?.url).toBe('http://squash.test/squash/api/rest/latest/test-cases?page=0');
    expect(calls[0]?.init).toMatchObject({
      method: 'POST',
      body: '{"name":"x"}',
      headers: { Authorization: 'Bearer api-token' },
    });
  });

  test('returns undefined for an empty 2xx body', async () => {
    const { squash } = client(new Response(null, { status: 204 }));

    await expect(squash.send({ method: 'PATCH', path: '/executions/1', body: {} })).resolves.toBeUndefined();
  });

  test('turns a non-2xx into SquashApiError carrying the status and Retry-After', async () => {
    const { squash } = client(
      new Response('slow down', { status: 429, headers: { 'Retry-After': String(RETRY_AFTER_SECONDS) } }),
    );

    const error: unknown = await squash.send({ method: 'GET', path: '/projects' }).catch((e: unknown) => e);

    expect(error).toBeInstanceOf(SquashApiError);
    expect(error).toMatchObject({ status: 429, retryAfterMs: RETRY_AFTER_MS });
    expect(String(error)).toContain('GET /projects → 429: slow down');
  });

  test('flags a refused connection, which is safe to retry even for a POST', async () => {
    const { squash } = client(new TypeError('fetch failed', { cause: { code: 'ECONNREFUSED' } }));

    const error: unknown = await squash.send({ method: 'POST', path: '/test-cases' }).catch((e: unknown) => e);

    expect(error).toBeInstanceOf(SquashNetworkError);
    expect(error).toMatchObject({ connectionRefused: true });
  });

  test('rejects a 2xx that is not JSON, such as an SSO login page', async () => {
    const { squash } = client(new Response('<html>Sign in</html>', { status: 200 }));

    await expect(squash.send({ method: 'GET', path: '/projects' })).rejects.toBeInstanceOf(
      SquashUnexpectedResponseError,
    );
  });
});
