import { readFileSync } from 'node:fs';
import { ConfidentialClientApplication } from '@azure/msal-node';
import { z } from 'zod';
import { env, hasCfAccessCredentials, requireAzureConfig } from '@shared/config';
import { writePrivateJsonFile } from '@shared/private-file';

const CACHE_FILE = 'playwright/.auth/api-token.json';
const EXPIRY_BUFFER_MS = 60_000;

export function shouldUseEntraAuthorization(): boolean {
  return env.apiAuth.required;
}

export async function apiAuthHeaders(): Promise<Record<string, string>> {
  if (!shouldUseEntraAuthorization()) return {};
  return { authorization: `Bearer ${await acquireEntraAccessToken()}` };
}

export function assertApiAuthEnvironment(): void {
  if (env.apiAuth.required) requireAzureConfig();

  if (env.cfAccess.required && !hasCfAccessCredentials()) {
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
let cachedClient: ConfidentialClientApplication | undefined;

// In-process, on disk (0600, write-then-rename), and one in-flight mint per process.
// The api-setup project warms the file so workers share one token.
export async function acquireEntraAccessToken(): Promise<string> {
  const scope = normaliseScope(requireAzureConfig().apiScope);
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

function normaliseScope(scope: string): string {
  return scope.endsWith('/.default') ? scope : `${scope}/.default`;
}

function readDiskCache(): CachedToken | undefined {
  try {
    const parsed = cachedTokenSchema.safeParse(JSON.parse(readFileSync(CACHE_FILE, 'utf-8')));
    return parsed.success ? parsed.data : undefined;
  } catch {
    return undefined;
  }
}

function persistToken(entry: CachedToken): CachedToken {
  memoryToken = entry;
  writePrivateJsonFile(CACHE_FILE, entry);
  return entry;
}

async function mintToken(scope: string): Promise<CachedToken> {
  const cfg = requireAzureConfig();
  cachedClient ??= new ConfidentialClientApplication({
    auth: { clientId: cfg.clientId, clientSecret: cfg.clientSecret, authority: cfg.authority },
  });
  const result = await cachedClient.acquireTokenByClientCredential({ scopes: [scope] });
  if (!result?.accessToken) throw new Error(`MSAL returned no access token for scope ${scope}.`);
  if (!result.expiresOn) throw new Error(`MSAL returned no expiresOn for scope ${scope}.`);

  console.log(`[entra-token] minted via client-credentials (context=${env.context.executionContext})`);
  return persistToken({ scope, token: result.accessToken, expiresAtMs: result.expiresOn.getTime() });
}
