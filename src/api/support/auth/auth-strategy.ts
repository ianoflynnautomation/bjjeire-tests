import { env } from '@shared/config';
import { AUTH_CONFIG } from './auth-config';
import type { AuthStrategy } from './auth-types';

let loggedStrategy: AuthStrategy | undefined;

type NamedError = { readonly name: string };

export function selectStrategy(): AuthStrategy {
  if (env.context.hasWorkloadIdentity) return 'chain';
  if (env.azure.clientSecret) return 'client-credentials';
  return 'chain';
}

export function logStrategyOnce(strategy: AuthStrategy): void {
  if (loggedStrategy === strategy) return;
  loggedStrategy = strategy;
  console.log(`[entra-token] auth strategy: ${strategy} (context=${env.context.executionContext})`);
}

export function isCredentialChainFallthrough(error: unknown): boolean {
  return isNamedError(error) && AUTH_CONFIG.fallthroughErrorNames.has(error.name);
}

export function resetLoggedStrategyForTests(): void {
  loggedStrategy = undefined;
}

function isNamedError(error: unknown): error is NamedError {
  return typeof error === 'object' && error !== null && 'name' in error && typeof error.name === 'string';
}
