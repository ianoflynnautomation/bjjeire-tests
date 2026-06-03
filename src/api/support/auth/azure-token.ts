import { DefaultAzureCredential, type TokenCredential } from '@azure/identity';
import { ConfidentialClientApplication, type AuthenticationResult } from '@azure/msal-node';
import { requireAzureConfig } from '@shared/config';
import { EmptyAccessTokenError, MissingTokenExpiryError } from './auth-errors';
import type { CachedToken } from './auth-types';
import { isCredentialChainFallthrough } from './auth-strategy';

let cachedCredential: TokenCredential | undefined;
let cachedClient: ConfidentialClientApplication | undefined;

export async function mintViaChain(scopeKey: string): Promise<CachedToken | undefined> {
  try {
    const result = await getCredential().getToken(scopeKey);
    if (!result) return undefined;
    return { token: result.token, expiresAtMs: result.expiresOnTimestamp };
  } catch (error: unknown) {
    if (isCredentialChainFallthrough(error)) return undefined;
    throw error;
  }
}

export async function mintViaClientCredentials(scopeKey: string): Promise<CachedToken> {
  const result = await getClient().acquireTokenByClientCredential({ scopes: [scopeKey] });
  return authResultToCachedToken(result, scopeKey);
}

export function resetAzureClientsForTests(): void {
  cachedClient = undefined;
  cachedCredential = undefined;
}

function getCredential(): TokenCredential {
  return (cachedCredential ??= new DefaultAzureCredential());
}

function getClient(): ConfidentialClientApplication {
  if (cachedClient) return cachedClient;
  const cfg = requireAzureConfig();
  cachedClient = new ConfidentialClientApplication({
    auth: {
      clientId: cfg.clientId,
      clientSecret: cfg.clientSecret,
      authority: cfg.authority,
    },
  });
  return cachedClient;
}

function authResultToCachedToken(result: AuthenticationResult | null, scope: string): CachedToken {
  if (!result?.accessToken) throw new EmptyAccessTokenError(scope);
  if (!result.expiresOn) throw new MissingTokenExpiryError(scope);
  return { token: result.accessToken, expiresAtMs: result.expiresOn.getTime() };
}
