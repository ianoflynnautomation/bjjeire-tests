import type { APIRequestContext } from '@playwright/test';

type QueryScalar = string | number | boolean;
export type QueryParams = Readonly<Record<string, QueryScalar | readonly QueryScalar[] | undefined>>;

export type GetOptions = Readonly<{
  params?: QueryParams;
}>;

function valuesOf(value: QueryScalar | readonly QueryScalar[]): readonly QueryScalar[] {
  return typeof value === 'object' ? value : [value];
}

function toSearchParams(params: QueryParams): URLSearchParams {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined) continue;
    for (const item of valuesOf(value)) search.append(key, String(item));
  }
  return search;
}

export async function get(context: APIRequestContext, path: string, options: GetOptions = {}): Promise<unknown> {
  const response = await context.get(path, options.params ? { params: toSearchParams(options.params) } : {});

  if (!response.ok()) {
    throw new Error(`GET ${path} → ${response.status()} ${response.statusText()}\n${await response.text()}`);
  }

  return (await response.json()) as unknown;
}
