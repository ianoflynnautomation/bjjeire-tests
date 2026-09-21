import { z } from 'zod';
import { env } from '@shared/config';
import { ENTRA_LOGIN_HOST, ENV_NAMES, OPENID_SCOPES } from './microsoft.login.constants';
import { firstEnv } from './microsoft.login.env';
import { type Credentials, type MsalTokenCache } from './microsoft.login.types';

type TokenClientConfig = Readonly<{
  clientId: string;
  authority: string;
  clientSecret?: string;
}>;

type TokenResponse = Readonly<{
  accessToken: string;
  idToken: string;
  expiresInSec: number;
  scope: string;
  refreshToken?: string;
}>;

type IdTokenClaims = z.infer<typeof IdTokenClaimsSchema>;

type MsalCacheInput = Readonly<{
  tokens: TokenResponse;
  clientId: string;
  username: string;
  claims: IdTokenClaims;
  localAccountId: string;
  expiresAtMs: number;
}>;

const TokenResponseSchema = z.object({
  access_token: z.string().min(1),
  id_token: z.string().min(1),
  expires_in: z.number().int().positive(),
  scope: z.string().optional(),
  refresh_token: z.string().optional(),
});

const IdTokenClaimsSchema = z.object({
  oid: z.string().min(1).optional(),
  sub: z.string().min(1).optional(),
  tid: z.string().min(1),
  preferred_username: z.string().optional(),
  upn: z.string().optional(),
  name: z.string().optional(),
  iss: z.string().optional(),
});

export async function acquireUserTokens(credentials: Credentials): Promise<MsalTokenCache | undefined> {
  const config = readTokenClientConfig();
  if (!config) return undefined;

  const scopes = delegatedScopes();
  const fromPublic = await requestPasswordToken(config, credentials, scopes, false);
  if (fromPublic) return toTokenCache(fromPublic, config.clientId, credentials);
  if (!config.clientSecret) return undefined;
  const fromConfidential = await requestPasswordToken(config, credentials, scopes, true);
  return fromConfidential ? toTokenCache(fromConfidential, config.clientId, credentials) : undefined;
}

function readTokenClientConfig(): TokenClientConfig | undefined {
  const tenantId = firstEnv(ENV_NAMES.tenantId) ?? env.azure.tenantId;
  const clientId = firstEnv(ENV_NAMES.clientId) ?? env.azure.clientId;
  if (!tenantId || !clientId) return undefined;

  const authority = env.azure.authority ?? `https://login.microsoftonline.com/${tenantId}`;
  const clientSecret = firstEnv(ENV_NAMES.clientSecret) ?? env.azure.clientSecret;
  return clientSecret ? { clientId, authority, clientSecret } : { clientId, authority };
}

export function applyMsalCacheInBrowser(entries: Readonly<Record<string, string>>): void {
  const root = globalThis as typeof globalThis & {
    localStorage: { setItem: (key: string, value: string) => void };
    sessionStorage: { setItem: (key: string, value: string) => void };
  };
  for (const key of Object.keys(entries)) {
    const value = entries[key];
    if (value === undefined) continue;
    root.localStorage.setItem(key, value);
    root.sessionStorage.setItem(key, value);
  }
}

function delegatedScopes(): string[] {
  const apiScope = env.azure.apiScope;
  if (apiScope && !apiScope.endsWith('/.default')) {
    return [apiScope, ...OPENID_SCOPES];
  }
  return [...OPENID_SCOPES];
}

async function requestPasswordToken(
  config: TokenClientConfig,
  credentials: Credentials,
  scopes: string[],
  confidential: boolean,
): Promise<TokenResponse | undefined> {
  if (confidential && !config.clientSecret) return undefined;
  const tokenUrl = `${config.authority.replace(/\/$/, '')}/oauth2/v2.0/token`;
  const body = passwordGrantBody(config, credentials, scopes, confidential);
  try {
    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body,
    });
    if (!response.ok) return undefined;
    return parseTokenResponse(await response.json());
  } catch {
    return undefined;
  }
}

function passwordGrantBody(
  config: TokenClientConfig,
  credentials: Credentials,
  scopes: string[],
  confidential: boolean,
): URLSearchParams {
  const body = new URLSearchParams({
    grant_type: 'password',
    client_id: config.clientId,
    username: credentials.username,
    password: credentials.password,
    scope: scopes.join(' '),
  });
  if (confidential && config.clientSecret) body.set('client_secret', config.clientSecret);
  return body;
}

function parseTokenResponse(json: unknown): TokenResponse | undefined {
  const parsed = TokenResponseSchema.safeParse(json);
  if (!parsed.success) return undefined;
  const data = parsed.data;
  return {
    accessToken: data.access_token,
    idToken: data.id_token,
    expiresInSec: data.expires_in,
    scope: data.scope ?? '',
    ...(data.refresh_token ? { refreshToken: data.refresh_token } : {}),
  };
}

function toTokenCache(tokens: TokenResponse, clientId: string, credentials: Credentials): MsalTokenCache | undefined {
  const claims = decodeIdToken(tokens.idToken);
  if (!claims) return undefined;
  const localAccountId = claims.oid ?? claims.sub;
  if (!localAccountId) return undefined;
  const expiresAtMs = Date.now() + tokens.expiresInSec * 1000;
  return {
    cache: buildMsalLocalStorage({
      tokens,
      clientId,
      username: claims.preferred_username ?? claims.upn ?? credentials.username,
      claims,
      localAccountId,
      expiresAtMs,
    }),
    expiresAtMs,
  };
}

function decodeIdToken(idToken: string): IdTokenClaims | undefined {
  const segment = idToken.split('.')[1];
  if (!segment) return undefined;
  try {
    const json: unknown = JSON.parse(Buffer.from(segment, 'base64url').toString('utf8'));
    const parsed = IdTokenClaimsSchema.safeParse(json);
    return parsed.success ? parsed.data : undefined;
  } catch {
    return undefined;
  }
}

function buildMsalLocalStorage(input: MsalCacheInput): Record<string, string> {
  const environment = issuerHost(input.claims.iss);
  const realm = input.claims.tid;
  const homeAccountId = `${input.localAccountId}.${realm}`;
  const accountKey = `${homeAccountId}.${environment}-${realm}`;
  const cachedAt = unixSeconds(Date.now());
  const expiresOn = unixSeconds(input.expiresAtMs);
  const target = input.tokens.scope.toLowerCase();
  const accessKey = `${homeAccountId}-${environment}-accesstoken-${input.clientId}-${realm}-${target}`;
  const idKey = `${homeAccountId}-${environment}-idtoken-${input.clientId}-${realm}-`;
  const refreshKey = input.tokens.refreshToken
    ? `${homeAccountId}-${environment}-refreshtoken-${input.clientId}--`
    : undefined;

  return {
    'msal.account.keys': JSON.stringify([accountKey]),
    [`msal.token.keys.${input.clientId}`]: JSON.stringify({
      idToken: [idKey],
      accessToken: [accessKey],
      refreshToken: refreshKey ? [refreshKey] : [],
    }),
    [accountKey]: JSON.stringify({
      homeAccountId,
      environment,
      realm,
      localAccountId: input.localAccountId,
      username: input.username,
      authorityType: 'MSSTS',
      ...(input.claims.name ? { name: input.claims.name } : {}),
    }),
    [accessKey]: JSON.stringify({
      homeAccountId,
      environment,
      credentialType: 'AccessToken',
      clientId: input.clientId,
      secret: input.tokens.accessToken,
      realm,
      target,
      cachedAt,
      expiresOn,
      extendedExpiresOn: expiresOn,
      tokenType: 'Bearer',
    }),
    [idKey]: JSON.stringify({
      homeAccountId,
      environment,
      credentialType: 'IdToken',
      clientId: input.clientId,
      secret: input.tokens.idToken,
      realm,
    }),
    ...refreshTokenEntry(refreshKey, homeAccountId, environment, input),
  };
}

function refreshTokenEntry(
  refreshKey: string | undefined,
  homeAccountId: string,
  environment: string,
  input: MsalCacheInput,
): Record<string, string> {
  if (!refreshKey || !input.tokens.refreshToken) return {};
  return {
    [refreshKey]: JSON.stringify({
      homeAccountId,
      environment,
      credentialType: 'RefreshToken',
      clientId: input.clientId,
      secret: input.tokens.refreshToken,
    }),
  };
}

function issuerHost(iss: string | undefined): string {
  if (!iss) return ENTRA_LOGIN_HOST;
  try {
    return new URL(iss).hostname;
  } catch {
    return ENTRA_LOGIN_HOST;
  }
}

function unixSeconds(epochMs: number): string {
  return String(Math.floor(epochMs / 1000));
}
