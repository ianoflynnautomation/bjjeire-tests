import { expect, type APIResponse } from '@playwright/test';
import type { ZodType } from 'zod';
import { fromError } from 'zod-validation-error';

const CONTENT_TYPE_HEADER = 'content-type';

export function statusMismatchMessage(expected: number, received: number): string {
  return `expected status ${expected}, received ${received}`;
}

export function expectStatusCode(response: APIResponse, expected: number): void {
  expect(response.status(), `API  ${statusMismatchMessage(expected, response.status())}`).toBe(expected);
}

export function expectContentType(response: APIResponse, matcher: string | RegExp): void {
  const headers = response.headers();
  const actual = headers[CONTENT_TYPE_HEADER];
  expect(actual, `Header '${CONTENT_TYPE_HEADER}' missing from response`).toBeDefined();
  if (matcher instanceof RegExp) {
    expect(actual).toMatch(matcher);
  } else {
    expect(actual).toContain(matcher);
  }
}

export function parseWithSchema<T>(schema: ZodType<T>, data: unknown, subject: string): T {
  const parsed = schema.safeParse(data);
  if (parsed.success) return parsed.data;
  throw new Error(`${subject} failed schema validation: ${fromError(parsed.error).message}`);
}

export async function expectResponseBody<T>(response: APIResponse, schema: ZodType<T>): Promise<T> {
  const json: unknown = await response.json();
  return parseWithSchema(schema, json, 'Response body');
}
