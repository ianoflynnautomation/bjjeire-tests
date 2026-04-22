import type { APIRequestContext, APIResponse } from '@playwright/test';
import type { ZodType } from 'zod';
import { verifyResponseBody, verifyStatusCode } from './assertions';

export type QueryParams = Readonly<Record<string, string | number | boolean | undefined>>;

export type ApiClient = {
  readonly request: APIRequestContext;
  readonly get: (path: string, query?: QueryParams) => Promise<APIResponse>;
  readonly post: (path: string, body?: unknown) => Promise<APIResponse>;
  readonly put: (path: string, body?: unknown) => Promise<APIResponse>;
  readonly patch: (path: string, body?: unknown) => Promise<APIResponse>;
  readonly delete: (path: string) => Promise<APIResponse>;
  readonly getJson: <T>(path: string, schema: ZodType<T>, query?: QueryParams) => Promise<T>;
  readonly postJson: <T>(path: string, schema: ZodType<T>, body?: unknown) => Promise<T>;
};

export function createApiClient(ctx: APIRequestContext): ApiClient {
  const toParams = (query?: QueryParams): Record<string, string | number | boolean> | undefined => {
    if (!query) return undefined;
    const entries = Object.entries(query).filter(
      (entry): entry is [string, string | number | boolean] => entry[1] !== undefined,
    );
    return entries.length > 0 ? Object.fromEntries(entries) : undefined;
  };

  return {
    request: ctx,
    get: (path, query) => {
      const params = toParams(query);
      return ctx.get(path, params ? { params } : {});
    },
    post: (path, body) => ctx.post(path, body === undefined ? {} : { data: body }),
    put: (path, body) => ctx.put(path, body === undefined ? {} : { data: body }),
    patch: (path, body) => ctx.patch(path, body === undefined ? {} : { data: body }),
    delete: path => ctx.delete(path),
    async getJson<T>(path: string, schema: ZodType<T>, query?: QueryParams): Promise<T> {
      const params = toParams(query);
      const response = await ctx.get(path, params ? { params } : {});
      await verifyStatusCode(response, 200);
      return verifyResponseBody(response, schema);
    },
    async postJson<T>(path: string, schema: ZodType<T>, body?: unknown): Promise<T> {
      const response = await ctx.post(path, body === undefined ? {} : { data: body });
      await verifyStatusCode(response, 200);
      return verifyResponseBody(response, schema);
    },
  };
}
