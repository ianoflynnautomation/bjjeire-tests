import { request, type APIRequestContext } from '@playwright/test';
import { env } from '@lib/config';

export type RequestContextOptions = {
  readonly baseURL?: string;
  readonly token?: string;
  readonly extraHeaders?: Record<string, string>;
  readonly ignoreHTTPSErrors?: boolean;
};

export async function createRequestContext(options: RequestContextOptions = {}): Promise<APIRequestContext> {
  const extraHTTPHeaders: Record<string, string> = {
    'content-type': 'application/json',
    accept: 'application/json',
    ...options.extraHeaders,
  };
  if (options.token) {
    extraHTTPHeaders['authorization'] = `Bearer ${options.token}`;
  }
  return request.newContext({
    baseURL: options.baseURL ?? env.apiUrl,
    ignoreHTTPSErrors: options.ignoreHTTPSErrors ?? env.acceptInvalidCerts,
    extraHTTPHeaders,
  });
}
