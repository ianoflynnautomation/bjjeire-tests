import { request, type APIRequestContext, type APIResponse } from '@playwright/test';
import type { ZodType } from 'zod';
import { cfAccessHeaders, env } from '@shared/config';
import { parseWithSchema, statusMismatchMessage } from './assertions';
import { acquireEntraAccessToken, shouldUseEntraAuthorization } from './auth';

export type AuthOption =
  | 'entra'
  | 'none'
  | { readonly kind: 'bearer'; readonly token: string }
  | { readonly kind: 'apiKey'; readonly header: string; readonly value: string }
  | { readonly kind: 'basic'; readonly username: string; readonly password: string };

export type RequestContextOptions = {
  readonly baseURL?: string;
  readonly extraHeaders?: Record<string, string>;
  readonly ignoreHTTPSErrors?: boolean;
  readonly auth?: AuthOption;
};

async function resolveAuthHeaders(auth: AuthOption): Promise<Record<string, string>> {
  if (auth === 'none') return {};
  if (auth === 'entra') {
    if (!shouldUseEntraAuthorization()) return {};
    return { authorization: `Bearer ${await acquireEntraAccessToken()}` };
  }
  switch (auth.kind) {
    case 'bearer':
      return { authorization: `Bearer ${auth.token}` };
    case 'apiKey':
      return { [auth.header]: auth.value };
    case 'basic': {
      const encoded = Buffer.from(`${auth.username}:${auth.password}`).toString('base64');
      return { authorization: `Basic ${encoded}` };
    }
  }
}

export async function createRequestContext(options: RequestContextOptions = {}): Promise<APIRequestContext> {
  const authHeaders = await resolveAuthHeaders(options.auth ?? 'entra');
  return request.newContext({
    baseURL: options.baseURL ?? env.apiUrl,
    ignoreHTTPSErrors: options.ignoreHTTPSErrors ?? env.acceptInvalidCerts,
    extraHTTPHeaders: {
      'content-type': 'application/json',
      accept: 'application/json',
      ...cfAccessHeaders(),
      ...authHeaders,
      ...options.extraHeaders,
    },
  });
}

type QueryValue = string | number | boolean | undefined;
type QueryParams = Readonly<Record<string, QueryValue>>;

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

type RequestOptions = Readonly<{
  params?: QueryParams;
  data?: unknown;
  headers?: Readonly<Record<string, string>>;
  timeout?: number;
}>;

type TypedRequestOptions<T> = RequestOptions &
  Readonly<{
    schema?: ZodType<T>;
  }>;

const OK_STATUS = 200;

function buildQueryParams(params?: QueryParams): Record<string, string | number | boolean> | undefined {
  if (!params) return undefined;
  const entries = Object.entries(params).filter(
    (entry): entry is [string, string | number | boolean] => entry[1] !== undefined,
  );
  return entries.length > 0 ? Object.fromEntries(entries) : undefined;
}

export async function apiRequest(
  context: APIRequestContext,
  method: HttpMethod,
  path: string,
  options: RequestOptions = {},
): Promise<APIResponse> {
  const params = buildQueryParams(options.params);
  return context.fetch(path, {
    method,
    failOnStatusCode: false,
    ...(params ? { params } : {}),
    ...(options.data !== undefined ? { data: options.data } : {}),
    ...(options.headers ? { headers: options.headers } : {}),
    ...(options.timeout !== undefined ? { timeout: options.timeout } : {}),
  });
}

export async function get<T>(
  context: APIRequestContext,
  path: string,
  options: TypedRequestOptions<T> = {},
): Promise<T> {
  const response = await apiRequest(context, 'GET', path, options);
  if (response.status() !== OK_STATUS) {
    throw new Error(
      `GET ${path} failed: ${statusMismatchMessage(OK_STATUS, response.status())}. Body: ${await response.text()}`,
    );
  }
  const json: unknown = await response.json();
  return options.schema ? parseWithSchema(options.schema, json, `GET ${path}`) : (json as T);
}
