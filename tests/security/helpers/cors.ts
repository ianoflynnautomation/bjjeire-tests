import { expect, type APIRequestContext, type APIResponse } from '@playwright/test';

export async function preflight(
  request: APIRequestContext,
  path: string,
  {
    origin,
    method = 'GET',
    headers = 'Authorization,Content-Type',
  }: { origin: string; method?: string; headers?: string },
): Promise<APIResponse> {
  return request.fetch(path, {
    method: 'OPTIONS',
    failOnStatusCode: false,
    headers: {
      Origin: origin,
      'Access-Control-Request-Method': method,
      'Access-Control-Request-Headers': headers,
    },
  });
}

export function expectOriginRejected(response: APIResponse, origin: string): void {
  const headers = response.headers();
  const allowOrigin = headers['access-control-allow-origin'];

  expect(allowOrigin, `CORS echoed disallowed origin '${origin}'`).not.toBe(origin);
  expect(allowOrigin, 'CORS returned wildcard allow-origin').not.toBe('*');
}

export function expectCredentialsDisallowed(response: APIResponse): void {
  const headers = response.headers();
  expect(headers['access-control-allow-credentials']).not.toBe('true');
}

export function expectMethodNotAllowed(response: APIResponse, method: string): void {
  const headers = response.headers();
  const allowed = headers['access-control-allow-methods'] ?? '';
  expect(
    allowed.toUpperCase().includes(method.toUpperCase()),
    `CORS allow-methods '${allowed}' should not include '${method}'`,
  ).toBe(false);
}
