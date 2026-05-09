import { expect, type APIResponse } from '@playwright/test';
import type { ZodType } from 'zod';

export type HeaderMatcher = string | RegExp;

const CONTENT_TYPE_HEADER = 'content-type';

function verifyStatusCode(response: APIResponse, expected: number): void {
  expect(response.status()).toBe(expected);
}

function verifyStatusCodeIn(response: APIResponse, expected: readonly number[]): void {
  expect(expected).toContain(response.status());
}

function verifyResponseHeader(response: APIResponse, name: string, expected: HeaderMatcher): void {
  const headers = response.headers();
  const actual = headers[name.toLowerCase()];
  expect(actual, `Header '${name}' missing from response`).toBeDefined();
  if (expected instanceof RegExp) {
    expect(actual).toMatch(expected);
  } else {
    expect(actual).toContain(expected);
  }
}

async function verifyResponseBody<T>(response: APIResponse, schema: ZodType<T>): Promise<T> {
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

async function verifyResponseJson(response: APIResponse, expected: Record<string, unknown>): Promise<void> {
  const json = (await response.json()) as Record<string, unknown>;
  expect(json).toMatchObject(expected);
}

export type ApiExpect = Readonly<{
  status: (expected: number) => ApiExpect;
  statusIn: (expected: readonly number[]) => ApiExpect;
  header: (name: string, matcher: HeaderMatcher) => ApiExpect;
  contentType: (matcher: HeaderMatcher) => ApiExpect;
  body: <T>(schema: ZodType<T>) => Promise<T>;
  matches: (shape: Record<string, unknown>) => Promise<void>;
}>;

export function expectApi(response: APIResponse): ApiExpect {
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
      verifyResponseHeader(response, CONTENT_TYPE_HEADER, matcher);
      return chain;
    },
    body(schema) {
      return verifyResponseBody(response, schema);
    },
    matches(shape) {
      return verifyResponseJson(response, shape);
    },
  };
  return chain;
}
