import { expect, type APIResponse } from '@playwright/test';
import type { ZodType } from 'zod';

export type HeaderMatcher = string | RegExp;

const CONTENT_TYPE_HEADER = 'content-type';
const BODY_PREVIEW_LIMIT = 2_000;

type ValidationIssue = Readonly<{
  path: string;
  message: string;
}>;

export class ApiAssertionJsonParseError extends Error {
  constructor(
    readonly bodyPreview: string,
    options?: ErrorOptions,
  ) {
    super(`Response body is not valid JSON. Body: ${bodyPreview}`, options);
    this.name = 'ApiAssertionJsonParseError';
  }
}

export class ApiAssertionSchemaError extends Error {
  constructor(readonly issues: readonly ValidationIssue[]) {
    super(`Response body failed schema validation:\n${formatValidationIssues(issues)}`);
    this.name = 'ApiAssertionSchemaError';
  }
}

export function expectApiStatus(response: APIResponse, expected: number): void {
  expect(response.status(), `Expected API status ${expected}, received ${response.status()}`).toBe(expected);
}

export function expectApiStatusIn(response: APIResponse, expected: readonly number[]): void {
  expect(expected, `Expected API status ${response.status()} to be one of ${expected.join(', ')}`).toContain(
    response.status(),
  );
}

export function expectApiHeader(response: APIResponse, name: string, expected: HeaderMatcher): void {
  const headers = response.headers();
  const actual = headers[name.toLowerCase()];
  expect(actual, `Header '${name}' missing from response`).toBeDefined();
  if (expected instanceof RegExp) {
    expect(actual).toMatch(expected);
  } else {
    expect(actual).toContain(expected);
  }
}

export function expectApiContentType(response: APIResponse, matcher: HeaderMatcher): void {
  expectApiHeader(response, CONTENT_TYPE_HEADER, matcher);
}

export async function expectApiBody<T>(response: APIResponse, schema: ZodType<T>): Promise<T> {
  const json = await readJson(response);
  const parsed = schema.safeParse(json);
  if (!parsed.success) throw new ApiAssertionSchemaError(toValidationIssues(parsed.error.issues));
  return parsed.data;
}

export async function expectApiJson(response: APIResponse, expected: Record<string, unknown>): Promise<void> {
  const json = await readJson(response);
  expect(json).toMatchObject(expected);
}

async function readJson(response: APIResponse): Promise<unknown> {
  try {
    return await response.json();
  } catch (error: unknown) {
    throw new ApiAssertionJsonParseError(await readBodyPreview(response), { cause: error });
  }
}

async function readBodyPreview(response: APIResponse): Promise<string> {
  const body = await response.text().catch(() => '<unavailable>');
  return body.length > BODY_PREVIEW_LIMIT ? `${body.slice(0, BODY_PREVIEW_LIMIT)}...<truncated>` : body;
}

function formatValidationIssues(issues: readonly ValidationIssue[]): string {
  return issues.map(issue => `  - ${issue.path}: ${issue.message}`).join('\n');
}

function toValidationIssues(issues: readonly { path: readonly PropertyKey[]; message: string }[]): ValidationIssue[] {
  return issues.map(issue => ({
    path: issue.path.join('.') || '(root)',
    message: issue.message,
  }));
}
