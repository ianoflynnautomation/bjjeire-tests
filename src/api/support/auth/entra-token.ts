import { env, requireApiAuthBasics } from '@shared/config';
import { MissingAuthStrategyError } from './auth-errors';
import { logStrategyOnce, resetLoggedStrategyForTests, selectStrategy } from './auth-strategy';
import { mintViaChain, mintViaClientCredentials, resetAzureClientsForTests } from './azure-token';
import {
  clearTokenCacheForTests,
  isFreshToken,
  persistToken,
  readDiskCache,
  readMemoryToken,
  writeMemoryToken,
} from './token-cache';

function normaliseScope(scope: string): string {
  return scope.endsWith('/.default') ? scope : `${scope}/.default`;
}

async function mintToken(scopeKey: string): Promise<{ readonly token: string; readonly expiresAtMs: number }> {
  const strategy = selectStrategy();

  if (strategy === 'chain') {
    const fromChain = await mintViaChain(scopeKey);
    if (fromChain) {
      logStrategyOnce('chain');
      return persistToken(scopeKey, fromChain);
    }
    if (!env.azure.clientSecret) throw new MissingAuthStrategyError();
  }

  const fromSecret = await mintViaClientCredentials(scopeKey);
  logStrategyOnce('client-credentials');
  return persistToken(scopeKey, fromSecret);
}

export async function acquireApiAccessToken(scope: string = requireApiAuthBasics().apiScope): Promise<string> {
  const cacheKey = normaliseScope(scope);

  const fromMemory = readMemoryToken(cacheKey);
  if (isFreshToken(fromMemory)) return fromMemory.token;

  const fromDisk = readDiskCache()[cacheKey];
  if (isFreshToken(fromDisk)) {
    writeMemoryToken(cacheKey, fromDisk);
    return fromDisk.token;
  }

  return (await mintToken(cacheKey)).token;
}

export function __resetEntraTokenCacheForTests(): void {
  clearTokenCacheForTests();
  resetAzureClientsForTests();
  resetLoggedStrategyForTests();
}
