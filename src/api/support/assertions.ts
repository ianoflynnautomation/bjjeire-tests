import { expect, type APIResponse } from '@playwright/test';
import type { ZodType } from 'zod';
import type { Pagination } from './types';

const CONTENT_TYPE_HEADER = 'content-type';
const BODY_PREVIEW_LIMIT = 2_000;

type ExpectedPaginationShape = Pick<
  Pagination,
  'totalItems' | 'currentPage' | 'pageSize' | 'totalPages' | 'hasNextPage' | 'hasPreviousPage'
>;

export function expectedPaginationFor(totalItems: number, pageSize: number, page: number): ExpectedPaginationShape {
  const totalPages = Math.ceil(totalItems / pageSize);
  return {
    totalItems,
    currentPage: page,
    pageSize,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
  };
}

export function expectNoOverlapBetweenPages<T extends { readonly id?: string }>(
  earlierPage: readonly T[],
  laterPage: readonly T[],
  entityLabel = 'entries',
): void {
  const earlierIds = new Set(earlierPage.map(item => item.id));
  const repeats = laterPage.filter(item => earlierIds.has(item.id));
  expect(repeats, `pages must not contain repeated ${entityLabel}`).toEqual([]);
}

export function expectStatusCode(response: APIResponse, expected: number): void {
  expect(response.status(), `Expected API status ${expected}, received ${response.status()}`).toBe(expected);
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

export async function expectResponseBody<T>(response: APIResponse, schema: ZodType<T>): Promise<T> {
  const json = await readJson(response);
  const parsed = schema.safeParse(json);
  if (parsed.success) return parsed.data;
  const issues = parsed.error.issues
    .map(issue => `  - ${issue.path.join('.') || '(root)'}: ${issue.message}`)
    .join('\n');
  throw new Error(`Response body failed schema validation:\n${issues}`);
}

async function readJson(response: APIResponse): Promise<unknown> {
  try {
    return await response.json();
  } catch (error: unknown) {
    const body = await response.text().catch(() => '<unavailable>');
    const preview = body.length > BODY_PREVIEW_LIMIT ? `${body.slice(0, BODY_PREVIEW_LIMIT)}...<truncated>` : body;
    throw new Error(`Response body is not valid JSON. Body: ${preview}`, { cause: error });
  }
}
