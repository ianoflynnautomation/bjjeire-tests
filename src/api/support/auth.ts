import { mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { DefaultAzureCredential, type TokenCredential } from '@azure/identity';
import { ConfidentialClientApplication } from '@azure/msal-node';
import { z } from 'zod';
import { env, requireApiAuthBasics, requireAzureConfig } from '@shared/config';

const CACHE_FILE = 'playwright/.auth/api-token.json';
const EXPIRY_BUFFER_MS = 60_000;
const FILE_MODE = 0o600;
// Every credential in the DefaultAzureCredential chain raises one of these when
// it simply isn't configured here; anything else is a real auth failure.
const FALLTHROUGH_ERROR_NAMES = new Set(['CredentialUnavailableError', 'AggregateAuthenticationError']);

export function shouldUseEntraAuthorization(): boolean {
  return env.apiAuth.required;
}

/**
 * Authorization headers for API request contexts. Returns `{}` for unprotected
 * environments (local, docker), so the same fixture works everywhere.
 */
export async function apiAuthHeaders(): Promise<Record<string, string>> {
  if (!shouldUseEntraAuthorization()) return {};
  return { authorization: `Bearer ${await acquireEntraAccessToken()}` };
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

const cachedTokenSchema = z.object({
  scope: z.string().min(1),
  token: z.string().min(1),
  expiresAtMs: z.number().int().positive(),
});

type CachedToken = z.infer<typeof cachedTokenSchema>;

let memoryToken: CachedToken | undefined;
let inflight: Promise<CachedToken> | undefined;

/**
 * Minting is expensive and every Playwright worker is its own process, so the
 * token is cached three ways: in-process (module state), across processes (a
 * 0600 file under playwright/.auth), and de-duplicated within a process while a
 * mint is in flight. The `api-setup` project warms it once before the suite runs.
 */
export async function acquireEntraAccessToken(): Promise<string> {
  const scope = normaliseScope(requireApiAuthBasics().apiScope);
  if (isFresh(memoryToken, scope)) return memoryToken.token;

  inflight ??= loadOrMintToken(scope).finally(() => {
    inflight = undefined;
  });
  return (await inflight).token;
}

async function loadOrMintToken(scope: string): Promise<CachedToken> {
  const fromDisk = readDiskCache();
  if (isFresh(fromDisk, scope)) {
    memoryToken = fromDisk;
    return fromDisk;
  }
  return mintToken(scope);
}

function isFresh(entry: CachedToken | undefined, scope: string): entry is CachedToken {
  return !!entry && entry.scope === scope && entry.expiresAtMs - EXPIRY_BUFFER_MS > Date.now();
}

function hasKnownStrategy(): boolean {
  return env.context.hasWorkloadIdentity || !!env.azure.clientSecret || env.context.isLocal;
}

function hasCfCreds(): boolean {
  return !!env.cfAccess.clientId && !!env.cfAccess.clientSecret;
}

function normaliseScope(scope: string): string {
  return scope.endsWith('/.default') ? scope : `${scope}/.default`;
}

function readDiskCache(): CachedToken | undefined {
  try {
    const parsed = cachedTokenSchema.safeParse(JSON.parse(readFileSync(CACHE_FILE, 'utf-8')));
    return parsed.success ? parsed.data : undefined;
  } catch {
    // Missing or corrupt cache is not an error — mint a fresh token instead.
    return undefined;
  }
}

function persistToken(entry: CachedToken): CachedToken {
  memoryToken = entry;
  // Write-then-rename: parallel workers never observe a half-written token.
  const tmpPath = `${CACHE_FILE}.${process.pid}.tmp`;
  mkdirSync(dirname(CACHE_FILE), { recursive: true });
  writeFileSync(tmpPath, JSON.stringify(entry, null, 2), { mode: FILE_MODE });
  renameSync(tmpPath, CACHE_FILE);
  return entry;
}

type AuthStrategy = 'chain' | 'client-credentials';

let cachedCredential: TokenCredential | undefined;
let cachedClient: ConfidentialClientApplication | undefined;

function selectStrategy(): AuthStrategy {
  return !env.context.hasWorkloadIdentity && env.azure.clientSecret ? 'client-credentials' : 'chain';
}

async function mintToken(scope: string): Promise<CachedToken> {
  if (selectStrategy() === 'chain') {
    const fromChain = await mintViaChain(scope);
    if (fromChain) return persist('chain', fromChain);

    if (!env.azure.clientSecret) {
      throw new Error(
        'No auth strategy available. Either:\n' +
          '  - Set AZURE_FEDERATED_TOKEN_FILE (handled automatically in ARC runner pods with workload identity), OR\n' +
          '  - Run `az login` locally, OR\n' +
          '  - Set AZURE_TESTS_CLIENT_ID + AZURE_TESTS_CLIENT_SECRET in your .env.<profile>.local for the client-credentials flow.',
      );
    }
  }

  return persist('client-credentials', await mintViaClientCredentials(scope));
}

function persist(strategy: AuthStrategy, entry: CachedToken): CachedToken {
  console.log(`[entra-token] minted via ${strategy} (context=${env.context.executionContext})`);
  return persistToken(entry);
}

async function mintViaChain(scope: string): Promise<CachedToken | undefined> {
  cachedCredential ??= new DefaultAzureCredential();
  try {
    const result = await cachedCredential.getToken(scope);
    return result ? { scope, token: result.token, expiresAtMs: result.expiresOnTimestamp } : undefined;
  } catch (error: unknown) {
    if (error instanceof Error && FALLTHROUGH_ERROR_NAMES.has(error.name)) return undefined;
    throw error;
  }
}

async function mintViaClientCredentials(scope: string): Promise<CachedToken> {
  if (!cachedClient) {
    const cfg = requireAzureConfig();
    cachedClient = new ConfidentialClientApplication({
      auth: { clientId: cfg.clientId, clientSecret: cfg.clientSecret, authority: cfg.authority },
    });
  }
  const result = await cachedClient.acquireTokenByClientCredential({ scopes: [scope] });
  if (!result?.accessToken) throw new Error(`MSAL returned no access token for scope ${scope}.`);
  if (!result.expiresOn) throw new Error(`MSAL returned no expiresOn for scope ${scope}.`);
  return { scope, token: result.accessToken, expiresAtMs: result.expiresOn.getTime() };
}
