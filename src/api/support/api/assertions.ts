import { expect, type APIResponse } from '@playwright/test';
import type { ZodType } from 'zod';

export type HeaderMatcher = string | RegExp;

export function verifyStatusCode(response: APIResponse, expected: number): void {
  expect(response.status()).toBe(expected);
}

export function verifyStatusCodeIn(response: APIResponse, expected: readonly number[]): void {
  expect(expected).toContain(response.status());
}

export function verifyResponseHeader(response: APIResponse, name: string, expected: HeaderMatcher): void {
  const headers = response.headers();
  const actual = headers[name.toLowerCase()];
  expect(actual, `Header '${name}' missing from response`).toBeDefined();
  if (expected instanceof RegExp) {
    expect(actual).toMatch(expected);
  } else {
    expect(actual).toContain(expected);
  }
}

export async function verifyResponseBody<T>(response: APIResponse, schema: ZodType<T>): Promise<T> {
  const json = (await response.json()) as unknown;
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map(issue => `  - ${issue.path.join('.') || '(root)'}: ${issue.message}`)
      .join('\n');
    throw new Error(`Response body failed schema validation:\n${issues}`);
  }
  return parsed.data;
}

export async function verifyResponseJson(response: APIResponse, expected: Record<string, unknown>): Promise<void> {
  const json = (await response.json()) as Record<string, unknown>;
  expect(json).toMatchObject(expected);
}

export function expectApi(response: APIResponse): ApiExpect {
  return createApiExpect(response);
}

export type ApiExpect = {
  readonly status: (expected: number) => ApiExpect;
  readonly statusIn: (expected: readonly number[]) => ApiExpect;
  readonly header: (name: string, matcher: HeaderMatcher) => ApiExpect;
  readonly contentType: (matcher: HeaderMatcher) => ApiExpect;
  readonly body: <T>(schema: ZodType<T>) => Promise<T>;
  readonly matches: (shape: Record<string, unknown>) => Promise<void>;
};

function createApiExpect(response: APIResponse): ApiExpect {
  const chain: ApiExpect = {
    status(expected) {
      verifyStatusCode(response, expected);
      return chain;
    },
    statusIn(expected) {
      verifyStatusCodeIn(response, expected);
      return chain;
    },
    header(name, matcher) {
      verifyResponseHeader(response, name, matcher);
      return chain;
    },
    contentType(matcher) {
      verifyResponseHeader(response, 'content-type', matcher);
      return chain;
    },
    async body<T>(schema: ZodType<T>) {
      return verifyResponseBody(response, schema);
    },
    async matches(shape) {
      await verifyResponseJson(response, shape);
    },
  };
  return chain;
}
