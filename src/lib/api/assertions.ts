import { expect, type APIResponse } from '@playwright/test';
import type { ZodType } from 'zod';

export type HeaderMatcher = string | RegExp;

export async function verifyStatusCode(response: APIResponse, expected: number): Promise<void> {
  const actual = response.status();
  if (actual !== expected) {
    const body = await safeText(response);
    expect.soft(actual, `Expected status ${expected} but got ${actual}. Body: ${body}`).toBe(expected);
    expect(actual).toBe(expected);
  }
}

export async function verifyStatusCodeIn(response: APIResponse, expected: readonly number[]): Promise<void> {
  const actual = response.status();
  if (!expected.includes(actual)) {
    const body = await safeText(response);
    throw new Error(`Expected status in [${expected.join(', ')}] but got ${actual}. Body: ${body}`);
  }
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
      void verifyStatusCode(response, expected);
      return chain;
    },
    statusIn(expected) {
      void verifyStatusCodeIn(response, expected);
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

async function safeText(response: APIResponse): Promise<string> {
  try {
    return (await response.text()).slice(0, 500);
  } catch {
    return '<no body>';
  }
}
