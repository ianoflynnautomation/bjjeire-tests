import type { APIRequestContext } from '@playwright/test';
import type { ZodType } from 'zod';
import { parseWithSchema } from './schemas';

type QueryScalar = string | number | boolean;
export type QueryParams = Readonly<Record<string, QueryScalar | readonly QueryScalar[] | undefined>>;

export type GetOptions<T> = Readonly<{
  params?: QueryParams;
  schema: ZodType<T>;
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

export async function get<T>(context: APIRequestContext, path: string, options: GetOptions<T>): Promise<T> {
  const response = await context.get(path, options.params ? { params: toSearchParams(options.params) } : {});

  if (!response.ok()) {
    throw new Error(`GET ${path} → ${response.status()} ${response.statusText()}\n${await response.text()}`);
  }

  const body: unknown = await response.json();
  return parseWithSchema(options.schema, body, `GET ${path}`);
}
