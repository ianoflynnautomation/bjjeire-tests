import { env } from '@shared/config';

export function hasApiAuthBasics(): boolean {
  return !!env.azure.tenantId && !!env.azure.apiScope;
}

export function hasKnownApiAuthStrategy(): boolean {
  return env.context.hasWorkloadIdentity || !!env.azure.clientSecret || env.context.isLocal;
}

export function shouldUseApiAuthorization(): boolean {
  return env.apiAuth.required || hasApiAuthBasics();
}

export function shouldRunApiAuthSetup(): boolean {
  return shouldUseApiAuthorization() || env.cfAccess.required || hasCloudflareAccessCredentials();
}

export function hasCloudflareAccessCredentials(): boolean {
  return !!env.cfAccess.clientId && !!env.cfAccess.clientSecret;
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

    if (!hasKnownApiAuthStrategy()) {
      throw new Error(
        'API auth is required but no supported credential strategy is available. Configure AKS workload identity, AZURE_TESTS_CLIENT_SECRET, or run locally with an Azure credential chain.',
      );
    }
  }

  if (env.cfAccess.required && !hasCloudflareAccessCredentials()) {
    throw new Error('Cloudflare Access is required but CF_ACCESS_CLIENT_ID / CF_ACCESS_CLIENT_SECRET are missing.');
  }
}
