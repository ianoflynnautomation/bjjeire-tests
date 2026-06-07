import { mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { DefaultAzureCredential, type TokenCredential } from '@azure/identity';
import { ConfidentialClientApplication, type AuthenticationResult } from '@azure/msal-node';
import { z } from 'zod';
import { env, requireApiAuthBasics, requireAzureConfig } from '@shared/config';

// ─── Config ─────────────────────────────────────────────────────────────────

const CACHE_FILE = 'playwright/.auth/api-tokens.json';
const EXPIRY_BUFFER_MS = 60_000;
const FILE_MODE = 0o600;
const FALLTHROUGH_ERROR_NAMES = new Set(['CredentialUnavailableError', 'AggregateAuthenticationError']);

// ─── Public surface ─────────────────────────────────────────────────────────

export function shouldUseEntraAuthorization(): boolean {
  return env.apiAuth.required || hasEntraAuthBasics();
}

export function assertApiAuthEnvironment(): void {
  if (env.apiAuth.required) {
    const missing = [
      env.azure.tenantId ? undefined : 'AZURE_TENANT_ID',
      env.azure.apiScope ? undefined : 'AZURE_API_SCOPE',
    ].filter((name): name is string => name !== undefined);

    if (missing.length > 0) {
      throw new Error(`API auth is required but missing ${missing.join(', ')}.`);
    }

    if (!hasKnownStrategy()) {
      throw new Error(
        'API auth is required but no supported credential strategy is available. Configure AKS workload identity, AZURE_TESTS_CLIENT_SECRET, or run locally with an Azure credential chain.',
      );
    }
  }

  if (env.cfAccess.required && !hasCfCreds()) {
    throw new Error('Cloudflare Access is required but CF_ACCESS_CLIENT_ID / CF_ACCESS_CLIENT_SECRET are missing.');
  }
}

export async function acquireEntraAccessToken(scope: string = requireApiAuthBasics().apiScope): Promise<string> {
  const cacheKey = normaliseScope(scope);

  const fromMemory = memoryCache.get(cacheKey);
  if (isFresh(fromMemory)) return fromMemory.token;

  const fromDisk = readDiskCache()[cacheKey];
  if (isFresh(fromDisk)) {
    memoryCache.set(cacheKey, fromDisk);
    return fromDisk.token;
  }

  return (await mintToken(cacheKey)).token;
}

// ─── Policy ─────────────────────────────────────────────────────────────────

function hasEntraAuthBasics(): boolean {
  return !!env.azure.tenantId && !!env.azure.apiScope;
}

function hasKnownStrategy(): boolean {
  return env.context.hasWorkloadIdentity || !!env.azure.clientSecret || env.context.isLocal;
}

function hasCfCreds(): boolean {
  return !!env.cfAccess.clientId && !!env.cfAccess.clientSecret;
}

// ─── Token cache (memory + disk) ────────────────────────────────────────────
// All caches are per-worker (each Playwright worker is a separate Node process).
// Disk writes use atomic tmp+rename. Multi-worker races against the disk file
// are benign — worst case one extra token mint, never corruption.

type CachedToken = Readonly<{ token: string; expiresAtMs: number }>;

const CachedTokenSchema = z
  .object({
    token: z.string().min(1),
    expiresAtMs: z.number().int().positive(),
  })
  .readonly();

const TokenCacheFileSchema = z.record(z.string().min(1), CachedTokenSchema);

const memoryCache = new Map<string, CachedToken>();

function isFresh(entry: CachedToken | undefined): entry is CachedToken {
  return !!entry && entry.expiresAtMs - EXPIRY_BUFFER_MS > Date.now();
}

function readDiskCache(): Record<string, CachedToken> {
  let raw: string;
  try {
    raw = readFileSync(CACHE_FILE, 'utf-8');
  } catch {
    return {};
  }

  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`[entra-token] discarding invalid JSON cache at ${CACHE_FILE}: ${message}`);
    return {};
  }

  const result = TokenCacheFileSchema.safeParse(json);
  if (result.success) return result.data;

  console.warn(`[entra-token] discarding malformed cache at ${CACHE_FILE}: ${result.error.message}`);
  return {};
}

function persistToken(scopeKey: string, entry: CachedToken): CachedToken {
  memoryCache.set(scopeKey, entry);
  const merged: Record<string, CachedToken> = { ...readDiskCache(), [scopeKey]: entry };
  const tmpPath = `${CACHE_FILE}.${process.pid}.tmp`;
  mkdirSync(dirname(CACHE_FILE), { recursive: true });
  writeFileSync(tmpPath, JSON.stringify(merged, null, 2), { mode: FILE_MODE });
  renameSync(tmpPath, CACHE_FILE);
  return entry;
}

// ─── Strategy selection + minting ───────────────────────────────────────────

type AuthStrategy = 'chain' | 'client-credentials';

let loggedStrategy: AuthStrategy | undefined;
let cachedCredential: TokenCredential | undefined;
let cachedClient: ConfidentialClientApplication | undefined;

function selectStrategy(): AuthStrategy {
  if (env.context.hasWorkloadIdentity) return 'chain';
  if (env.azure.clientSecret) return 'client-credentials';
  return 'chain';
}

function logStrategyOnce(strategy: AuthStrategy): void {
  if (loggedStrategy === strategy) return;
  loggedStrategy = strategy;
  console.log(`[entra-token] auth strategy: ${strategy} (context=${env.context.executionContext})`);
}

function isCredentialChainFallthrough(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'name' in error &&
    typeof error.name === 'string' &&
    FALLTHROUGH_ERROR_NAMES.has(error.name)
  );
}

function normaliseScope(scope: string): string {
  return scope.endsWith('/.default') ? scope : `${scope}/.default`;
}

async function mintToken(scopeKey: string): Promise<CachedToken> {
  const strategy = selectStrategy();

  if (strategy === 'chain') {
    const fromChain = await mintViaChain(scopeKey);
    if (fromChain) {
      logStrategyOnce('chain');
      return persistToken(scopeKey, fromChain);
    }
    if (!env.azure.clientSecret) {
      throw new Error(
        'No auth strategy available. Either:\n' +
          '  - Set AZURE_FEDERATED_TOKEN_FILE (handled automatically in ARC runner pods with workload identity), OR\n' +
          '  - Run `az login` locally, OR\n' +
          '  - Set AZURE_TESTS_CLIENT_ID + AZURE_TESTS_CLIENT_SECRET in your .env.<profile>.local for the client-credentials flow.',
      );
    }
  }

  const fromSecret = await mintViaClientCredentials(scopeKey);
  logStrategyOnce('client-credentials');
  return persistToken(scopeKey, fromSecret);
}

async function mintViaChain(scopeKey: string): Promise<CachedToken | undefined> {
  cachedCredential ??= new DefaultAzureCredential();
  try {
    const result = await cachedCredential.getToken(scopeKey);
    if (!result) return undefined;
    return { token: result.token, expiresAtMs: result.expiresOnTimestamp };
  } catch (error: unknown) {
    if (isCredentialChainFallthrough(error)) return undefined;
    throw error;
  }
}

async function mintViaClientCredentials(scopeKey: string): Promise<CachedToken> {
  if (!cachedClient) {
    const cfg = requireAzureConfig();
    cachedClient = new ConfidentialClientApplication({
      auth: {
        clientId: cfg.clientId,
        clientSecret: cfg.clientSecret,
        authority: cfg.authority,
      },
    });
  }
  const result: AuthenticationResult | null = await cachedClient.acquireTokenByClientCredential({ scopes: [scopeKey] });
  if (!result?.accessToken) throw new Error(`MSAL returned no access token for scope ${scopeKey}.`);
  if (!result.expiresOn) throw new Error(`MSAL returned no expiresOn for scope ${scopeKey}.`);
  return { token: result.accessToken, expiresAtMs: result.expiresOn.getTime() };
}
