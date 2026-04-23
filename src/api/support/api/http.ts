import type { APIRequestContext, APIResponse } from '@playwright/test';

type QueryValue = string | number | boolean | undefined;
export type QueryParams = Readonly<Record<string, QueryValue>>;

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export type RequestOptions = {
  readonly params?: QueryParams;
  readonly data?: unknown;
  readonly headers?: Readonly<Record<string, string>>;
  readonly timeout?: number;
};

export type TypedRequestOptions = RequestOptions & {
  readonly expectedStatus?: number;
};

export function buildQueryParams(params?: QueryParams): Record<string, string | number | boolean> | undefined {
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

export async function readTypedResponse<T>(
  response: APIResponse,
  { expectedStatus = 200, context }: { expectedStatus?: number; context: string },
): Promise<T> {
  if (response.status() !== expectedStatus) {
    const body = await response.text().catch(() => '<unavailable>');
    throw new Error(`${context} failed: expected ${expectedStatus}, received ${response.status()}. Body: ${body}`);
  }
  return (await response.json()) as T;
}

async function executeTyped<T>(
  request: APIRequestContext,
  method: HttpMethod,
  path: string,
  options: TypedRequestOptions = {},
): Promise<T> {
  const response = await rawRequest(request, method, path, options);
  return readTypedResponse<T>(response, {
    context: `${method} ${path}`,
    ...(options.expectedStatus !== undefined ? { expectedStatus: options.expectedStatus } : {}),
  });
}

export async function getTyped<T>(
  request: APIRequestContext,
  path: string,
  options: TypedRequestOptions = {},
): Promise<T> {
  return executeTyped<T>(request, 'GET', path, options);
}

export async function postTyped<T>(
  request: APIRequestContext,
  path: string,
  options: TypedRequestOptions = {},
): Promise<T> {
  return executeTyped<T>(request, 'POST', path, { expectedStatus: 201, ...options });
}

export async function putTyped<T>(
  request: APIRequestContext,
  path: string,
  options: TypedRequestOptions = {},
): Promise<T> {
  return executeTyped<T>(request, 'PUT', path, options);
}

export async function patchTyped<T>(
  request: APIRequestContext,
  path: string,
  options: TypedRequestOptions = {},
): Promise<T> {
  return executeTyped<T>(request, 'PATCH', path, options);
}

export async function deleteTyped(
  request: APIRequestContext,
  path: string,
  options: TypedRequestOptions = {},
): Promise<void> {
  const response = await rawRequest(request, 'DELETE', path, options);
  const expected = options.expectedStatus ?? 204;
  if (response.status() !== expected) {
    const body = await response.text().catch(() => '<unavailable>');
    throw new Error(`DELETE ${path} failed: expected ${expected}, received ${response.status()}. Body: ${body}`);
  }
}
