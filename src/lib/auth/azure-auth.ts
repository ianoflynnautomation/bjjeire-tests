import { ConfidentialClientApplication, type Configuration } from '@azure/msal-node';
import { request } from '@playwright/test';
import { env, requireAzureConfig } from '@lib/config';

export type AzureRole = 'admin' | 'user' | 'guest' | (string & {});

export type AzureTokenRequest = {
  readonly scope?: string;
  readonly role?: AzureRole;
};

export type AzureToken = {
  readonly accessToken: string;
  readonly expiresOn: Date;
  readonly scopes: readonly string[];
};

const TOKEN_CACHE = new Map<string, AzureToken>();

function cacheKey(scope: string, role: AzureRole): string {
  return `${role}::${scope}`;
}

function isExpired(token: AzureToken): boolean {
  return token.expiresOn.getTime() - Date.now() < 60_000;
}

function buildClient(): ConfidentialClientApplication {
  const cfg = requireAzureConfig();
  const msalConfig: Configuration = {
    auth: {
      clientId: cfg.clientId,
      clientSecret: cfg.clientSecret,
      authority: cfg.authority,
    },
  };
  return new ConfidentialClientApplication(msalConfig);
}

export async function acquireAzureToken(options: AzureTokenRequest = {}): Promise<AzureToken> {
  const scope = options.scope ?? requireAzureConfig().apiScope;
  const role: AzureRole = options.role ?? 'user';
  const key = cacheKey(scope, role);
  const cached = TOKEN_CACHE.get(key);
  if (cached && !isExpired(cached)) return cached;

  const client = buildClient();
  const result = await client.acquireTokenByClientCredential({ scopes: [scope] });
  if (!result?.accessToken) {
    throw new Error(`Azure AD token acquisition failed for scope '${scope}'`);
  }
  const token: AzureToken = {
    accessToken: result.accessToken,
    expiresOn: result.expiresOn ?? new Date(Date.now() + 55 * 60_000),
    scopes: result.scopes ?? [scope],
  };
  TOKEN_CACHE.set(key, token);
  return token;
}

export type StorageStateOptions = {
  readonly path: string;
  readonly role?: AzureRole;
  readonly origin?: string;
  readonly tokenStorageKey?: string;
};

export async function writeAzureStorageState(options: StorageStateOptions): Promise<string> {
  const origin = options.origin ?? env.baseUrl;
  const key = options.tokenStorageKey ?? 'access_token';
  const token = await acquireAzureToken({ role: options.role });

  const ctx = await request.newContext({
    baseURL: env.baseUrl,
    ignoreHTTPSErrors: env.acceptInvalidCerts,
  });
  await ctx.storageState({ path: options.path });
  await ctx.dispose();

  const fs = await import('node:fs/promises');
  const raw = await fs.readFile(options.path, 'utf-8');
  const state = JSON.parse(raw) as {
    origins?: Array<{ origin: string; localStorage: Array<{ name: string; value: string }> }>;
  };
  state.origins = state.origins ?? [];
  const existing = state.origins.find(o => o.origin === origin);
  const entry = { name: key, value: token.accessToken };
  if (existing) {
    existing.localStorage = existing.localStorage.filter(item => item.name !== key);
    existing.localStorage.push(entry);
  } else {
    state.origins.push({ origin, localStorage: [entry] });
  }
  await fs.writeFile(options.path, JSON.stringify(state, null, 2));
  return options.path;
}

export function clearTokenCache(): void {
  TOKEN_CACHE.clear();
}
