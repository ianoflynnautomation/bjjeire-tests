import { request, type APIRequestContext } from '@playwright/test';
import { env } from '@shared/config';
import { acquireApiAccessToken, cfAccessHeaders, shouldUseApiAuthorization } from '@api/support/auth';

export type RequestContextOptions = {
  readonly baseURL?: string;
  readonly token?: string;
  readonly extraHeaders?: Record<string, string>;
  readonly ignoreHTTPSErrors?: boolean;
  // Controls Authorization-header acquisition:
  //   - 'auto' (default): use options.token, else acquire client-credentials token when AZURE_CLIENT_SECRET is set.
  //   - 'none': never attach Authorization. Use for unauthenticated negative tests.
  readonly auth?: 'auto' | 'none';
};

async function resolveBearerToken(options: RequestContextOptions): Promise<string | undefined> {
  if (options.auth === 'none') return undefined;
  if (options.token) return options.token;
  if (!shouldUseApiAuthorization()) return undefined;
  return acquireApiAccessToken();
}

export async function createRequestContext(options: RequestContextOptions = {}): Promise<APIRequestContext> {
  const extraHTTPHeaders: Record<string, string> = {
    'content-type': 'application/json',
    accept: 'application/json',
    ...cfAccessHeaders(),
    ...options.extraHeaders,
  };
  const token = await resolveBearerToken(options);
  if (token) {
    extraHTTPHeaders['authorization'] = `Bearer ${token}`;
  }
  return request.newContext({
    baseURL: options.baseURL ?? env.apiUrl,
    ignoreHTTPSErrors: options.ignoreHTTPSErrors ?? env.acceptInvalidCerts,
    extraHTTPHeaders,
  });
}
