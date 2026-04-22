import type { APIRequestContext, APIResponse } from '@playwright/test';

type QueryValue = string | number | boolean | undefined;
export type QueryParams = Readonly<Record<string, QueryValue>>;

export function buildQueryParams(params?: QueryParams): Record<string, string | number | boolean> | undefined {
  if (!params) {
    return undefined;
  }

  const entries = Object.entries(params).filter(
    (entry): entry is [string, string | number | boolean] => entry[1] !== undefined,
  );

  return entries.length > 0 ? Object.fromEntries(entries) : undefined;
}

export async function readTypedResponse<T>(
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
    const body = await response.text().catch(() => '<unavailable>');
    throw new Error(`${context} failed: expected ${expectedStatus}, received ${response.status()}. Body: ${body}`);
  }

  return (await response.json()) as T;
}

export async function getTyped<T>(request: APIRequestContext, path: string, params?: QueryParams): Promise<T> {
  const normalizedParams = buildQueryParams(params);
  const response = await request.get(path, {
    ...(normalizedParams ? { params: normalizedParams } : {}),
    failOnStatusCode: false,
  });

  return readTypedResponse<T>(response, { context: `GET ${path}` });
}
