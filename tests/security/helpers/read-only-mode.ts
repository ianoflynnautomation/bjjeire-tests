import { expect, type APIResponse } from '@playwright/test';

const READ_ONLY_RFC_TYPE = /rfc7231#section-6\.5\.5/;
const PROBLEM_CONTENT_TYPE = /application\/(?:problem\+)?json/;
const REQUIRED_ALLOW_METHODS = ['GET', 'HEAD', 'OPTIONS'] as const;
const READ_ONLY_DETAIL_FRAGMENT = 'read-only mode';

type ProblemDetails = Readonly<{
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
}>;

/**
 * Validates a 405 ProblemDetails response from `ReadOnlyModeExtensions.cs`.
 * - status 405 + JSON content-type
 * - `Allow` header includes GET, HEAD, OPTIONS
 * - body conforms to ProblemDetails with the read-only `detail` fragment
 */
export async function expectReadOnlyResponse(response: APIResponse): Promise<void> {
  expect(response.status()).toBe(405);
  expect(response.headers()['content-type'] ?? '').toMatch(PROBLEM_CONTENT_TYPE);

  const allowHeader = (response.headers().allow ?? '').toUpperCase();
  for (const method of REQUIRED_ALLOW_METHODS) {
    expect(allowHeader, `Allow header missing ${method}`).toContain(method);
  }

  const problem = (await response.json()) as ProblemDetails;
  expect(problem.type).toMatch(READ_ONLY_RFC_TYPE);
  expect(problem.title).toBe('Method Not Allowed');
  expect(problem.status).toBe(405);
  expect(problem.detail).toContain(READ_ONLY_DETAIL_FRAGMENT);
}
