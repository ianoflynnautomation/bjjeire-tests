import { request, type APIRequestContext, type APIResponse } from '@playwright/test';
import { cfAccessHeaders, env } from '@shared/config';
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

type TypedRequestOptions = RequestOptions &
  Readonly<{
    expectedStatus?: number;
  }>;

const DEFAULT_OK_STATUS = 200;
const BODY_PREVIEW_LIMIT = 2_000;

function buildQueryParams(params?: QueryParams): Record<string, string | number | boolean> | undefined {
  if (!params) return undefined;
  const entries = Object.entries(params).filter(
    (entry): entry is [string, string | number | boolean] => entry[1] !== undefined,
  );
  return entries.length > 0 ? Object.fromEntries(entries) : undefined;
}

export async function apiRequest(
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

export async function get<T>(request: APIRequestContext, path: string, options: TypedRequestOptions = {}): Promise<T> {
  const response = await apiRequest(request, 'GET', path, options);
  const expectedStatus = options.expectedStatus ?? DEFAULT_OK_STATUS;
  if (response.status() !== expectedStatus) {
    throw new Error(
      `GET ${path} failed: expected status ${expectedStatus}, received ${response.status()}. Body: ${await readBodyPreview(response)}`,
    );
  }
  try {
    return (await response.json()) as T;
  } catch (error: unknown) {
    throw new Error(`GET ${path} returned invalid JSON. Body: ${await readBodyPreview(response)}`, { cause: error });
  }
}

async function readBodyPreview(response: APIResponse): Promise<string> {
  const body = await response.text().catch(() => '<unavailable>');
  return body.length > BODY_PREVIEW_LIMIT ? `${body.slice(0, BODY_PREVIEW_LIMIT)}...<truncated>` : body;
}
