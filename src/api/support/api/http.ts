import type { APIRequestContext, APIResponse } from '@playwright/test';
import { env } from '@api/support/config';

type QueryValue = string | number | boolean | undefined;
type HttpQueryParams = Record<string, QueryValue>;

function toParams(params: HttpQueryParams): Record<string, string | number | boolean> | undefined {
  const entries = Object.entries(params).filter(
    (entry): entry is [string, string | number | boolean] => entry[1] !== undefined,
  );

  return entries.length > 0 ? Object.fromEntries(entries) : undefined;
}

async function parseJsonResponse<T>(
  response: APIResponse,
  {
    expectedStatus = 200,
    context,
  }: {
    expectedStatus?: number;
    context: string;
  },
): Promise<T> {
  if (response.status() !== expectedStatus) {
    const body = await response.text().catch(() => '<no body>');
    throw new Error(`${context} failed: expected ${expectedStatus}, received ${response.status()}. Body: ${body}`);
  }

  return (await response.json()) as T;
}

export async function getTyped<T>(request: APIRequestContext, path: string, params: HttpQueryParams = {}): Promise<T> {
  const normalizedParams = toParams(params);
  const response = await request.get(path, {
    ...(normalizedParams ? { params: normalizedParams } : {}),
    failOnStatusCode: false,
  });

  return parseJsonResponse<T>(response, { context: `GET ${path}` });
}

export function createApiHeaders(
  options: {
    bearerToken?: string;
    apiKey?: { header: string; value: string };
    extraHeaders?: Record<string, string>;
  } = {},
): Record<string, string> {
  const headers: Record<string, string> = {
    accept: 'application/json',
    'content-type': 'application/json',
    ...options.extraHeaders,
  };

  if (options.bearerToken) {
    headers.authorization = `Bearer ${options.bearerToken}`;
  }

  if (options.apiKey) {
    headers[options.apiKey.header] = options.apiKey.value;
  }

  return headers;
}

export function defaultApiBaseUrl(): string {
  return env.apiUrl;
}
