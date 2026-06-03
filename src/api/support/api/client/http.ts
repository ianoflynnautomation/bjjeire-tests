import type { APIRequestContext, APIResponse } from '@playwright/test';
import type { ZodType } from 'zod';

type QueryValue = string | number | boolean | undefined;
export type QueryParams = Readonly<Record<string, QueryValue>>;

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export type RequestOptions = Readonly<{
  params?: QueryParams;
  data?: unknown;
  headers?: Readonly<Record<string, string>>;
  timeout?: number;
}>;

export type TypedRequestOptions = RequestOptions &
  Readonly<{
    expectedStatus?: number;
  }>;

const DEFAULT_OK_STATUS = 200;
const BODY_PREVIEW_LIMIT = 2_000;

export type ApiResponseContext = Readonly<{
  method: HttpMethod;
  path: string;
}>;

type ValidationIssue = Readonly<{
  path: string;
  message: string;
}>;

export class ApiStatusError extends Error {
  constructor(
    readonly context: ApiResponseContext,
    readonly expectedStatus: number,
    readonly actualStatus: number,
    readonly bodyPreview: string,
  ) {
    super(
      `${formatContext(context)} failed: expected status ${expectedStatus}, received ${actualStatus}. Body: ${bodyPreview}`,
    );
    this.name = 'ApiStatusError';
  }
}

export class ApiJsonParseError extends Error {
  constructor(
    readonly context: ApiResponseContext,
    readonly bodyPreview: string,
    options?: ErrorOptions,
  ) {
    super(`${formatContext(context)} returned invalid JSON. Body: ${bodyPreview}`, options);
    this.name = 'ApiJsonParseError';
  }
}

export class ApiSchemaValidationError extends Error {
  constructor(
    readonly context: ApiResponseContext,
    readonly issues: readonly ValidationIssue[],
  ) {
    super(`${formatContext(context)} response failed schema validation:\n${formatValidationIssues(issues)}`);
    this.name = 'ApiSchemaValidationError';
  }
}

function buildQueryParams(params?: QueryParams): Record<string, string | number | boolean> | undefined {
  if (!params) return undefined;
  const entries = Object.entries(params).filter(
    (entry): entry is [string, string | number | boolean] => entry[1] !== undefined,
  );
  return entries.length > 0 ? Object.fromEntries(entries) : undefined;
}

export async function rawRequest(
  request: APIRequestContext,
  method: HttpMethod,
  path: string,
  options: RequestOptions = {},
): Promise<APIResponse> {
  const params = buildQueryParams(options.params);
  return request.fetch(path, {
    method,
    failOnStatusCode: false,
    ...(params ? { params } : {}),
    ...(options.data !== undefined ? { data: options.data } : {}),
    ...(options.headers ? { headers: options.headers } : {}),
    ...(options.timeout !== undefined ? { timeout: options.timeout } : {}),
  });
}

async function assertExpectedStatus(
  response: APIResponse,
  expectedStatus: number,
  context: ApiResponseContext,
): Promise<void> {
  const actualStatus = response.status();
  if (actualStatus === expectedStatus) return;
  throw new ApiStatusError(context, expectedStatus, actualStatus, await readBodyPreview(response));
}

async function readJson(response: APIResponse, context: ApiResponseContext): Promise<unknown> {
  try {
    return await response.json();
  } catch (error: unknown) {
    throw new ApiJsonParseError(context, await readBodyPreview(response), { cause: error });
  }
}

async function readBodyPreview(response: APIResponse): Promise<string> {
  const body = await response.text().catch(() => '<unavailable>');
  return body.length > BODY_PREVIEW_LIMIT ? `${body.slice(0, BODY_PREVIEW_LIMIT)}...<truncated>` : body;
}

function formatContext({ method, path }: ApiResponseContext): string {
  return `${method} ${path}`;
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

async function readTypedResponse<T>(
  response: APIResponse,
  { expectedStatus, context }: { expectedStatus: number; context: ApiResponseContext },
): Promise<T> {
  await assertExpectedStatus(response, expectedStatus, context);
  return (await readJson(response, context)) as T;
}

async function readParsedResponse<T>(
  response: APIResponse,
  schema: ZodType<T>,
  { expectedStatus, context }: { expectedStatus: number; context: ApiResponseContext },
): Promise<T> {
  await assertExpectedStatus(response, expectedStatus, context);
  const result = schema.safeParse(await readJson(response, context));
  if (result.success) return result.data;
  throw new ApiSchemaValidationError(context, toValidationIssues(result.error.issues));
}

export async function getTyped<T>(
  request: APIRequestContext,
  path: string,
  options: TypedRequestOptions = {},
): Promise<T> {
  const response = await rawRequest(request, 'GET', path, options);
  return readTypedResponse<T>(response, {
    expectedStatus: options.expectedStatus ?? DEFAULT_OK_STATUS,
    context: { method: 'GET', path },
  });
}

export async function getParsed<T>(
  request: APIRequestContext,
  path: string,
  schema: ZodType<T>,
  options: TypedRequestOptions = {},
): Promise<T> {
  const response = await rawRequest(request, 'GET', path, options);
  return readParsedResponse<T>(response, schema, {
    expectedStatus: options.expectedStatus ?? DEFAULT_OK_STATUS,
    context: { method: 'GET', path },
  });
}
