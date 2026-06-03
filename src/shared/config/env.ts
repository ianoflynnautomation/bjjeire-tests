import { MissingProfileUrlError } from './config-errors';
import { isRemoteProfile, PROFILE_DEFAULTS } from './profile-defaults';
import { loadEnvForProfile, resolveProfile, type Profile } from './profile';
import { readEnv, readEnvFlag, readRequiredEnv } from './process-env';

loadEnvForProfile();

const DEFAULT_AZURE_AUTHORITY_PREFIX = 'https://login.microsoftonline.com';

export type AzureConfig = Readonly<{
  tenantId: string;
  clientId: string;
  clientSecret: string;
  apiScope: string;
  authority: string;
}>;

export type ApiAuthBasics = Readonly<{
  tenantId: string;
  apiScope: string;
  authority: string;
}>;

export type ExecutionContext = 'arc-runner' | 'ci-hosted' | 'testcontainers' | 'local';

export type RuntimeContext = Readonly<{
  executionContext: ExecutionContext;
  isCI: boolean;
  isGithubActions: boolean;
  isInCluster: boolean;
  hasWorkloadIdentity: boolean;
  isTestcontainers: boolean;
  isLocal: boolean;
}>;

type OptionalAzureEnv = Readonly<{
  tenantId: string | undefined;
  clientId: string | undefined;
  clientSecret: string | undefined;
  apiScope: string | undefined;
  authority: string | undefined;
}>;

type OptionalCredentials = Readonly<{
  clientId: string | undefined;
  clientSecret: string | undefined;
}>;

type OptionalUserCredentials = Readonly<{
  username: string | undefined;
  password: string | undefined;
}>;

export type Env = Readonly<{
  profile: Profile;
  baseUrl: string;
  apiUrl: string;
  mongoUrl: string;
  mongoDb: string;
  isCI: boolean;
  acceptInvalidCerts: boolean;
  context: RuntimeContext;
  azure: OptionalAzureEnv;
  cfAccess: OptionalCredentials;
  uiTestUser: OptionalUserCredentials;
}>;

function stripTrailingSlash(value: string): string {
  return value.endsWith('/') ? value.slice(0, -1) : value;
}

function pick(name: string, fallback: string): string {
  return readEnv(name) ?? fallback;
}

const PROFILE: Profile = resolveProfile();
const defaults = PROFILE_DEFAULTS[PROFILE];

const baseUrl = stripTrailingSlash(pick('BASE_URL', defaults.baseUrl));
const apiUrl = stripTrailingSlash(pick('API_URL', defaults.apiUrl));

if (isRemoteProfile(PROFILE)) {
  if (!baseUrl) throw new MissingProfileUrlError(PROFILE, 'BASE_URL');
  if (!apiUrl) throw new MissingProfileUrlError(PROFILE, 'API_URL');
}

// =====================================================================
// Execution-context detection
// =====================================================================
// Used by tests to make environment-aware decisions like
// `test.skip(env.context.isLocal, 'requires CI environment')`, and by
// `entra-token.ts` to pick the right auth strategy. All signals are derived
// from environment variables that the runtime sets for us — no heuristics.

const isCI = readEnv('CI') !== undefined;
const isGithubActions = readEnv('GITHUB_ACTIONS') !== undefined;
// AZURE_FEDERATED_TOKEN_FILE is injected by the Azure Workload Identity
// webhook into pods that have the right label/annotation. Its presence is
// the canonical signal that we're running with a workload identity.
const hasWorkloadIdentity = readEnv('AZURE_FEDERATED_TOKEN_FILE') !== undefined;
// KUBERNETES_SERVICE_HOST is set inside every pod regardless of WI config.
const isInCluster = hasWorkloadIdentity || readEnv('KUBERNETES_SERVICE_HOST') !== undefined;
const isTestcontainers = PROFILE === 'testcontainers';
const isLocal = !isCI && !isInCluster;

const executionContext: ExecutionContext = hasWorkloadIdentity
  ? 'arc-runner'
  : isCI
    ? 'ci-hosted'
    : isTestcontainers
      ? 'testcontainers'
      : 'local';

// =====================================================================
// Optional-field convention
// =====================================================================
// Every secret/credential block uses `string | undefined` rather than `string`
// with `''` sentinels. With `exactOptionalPropertyTypes` on, this lets callers
// pattern-match cleanly: `if (env.cfAccess.clientId) { ... }`. The `requireX`
// helpers below throw when the field is absent and the caller can't proceed.

const runtimeContext: RuntimeContext = Object.freeze({
  executionContext,
  isCI,
  isGithubActions,
  isInCluster,
  hasWorkloadIdentity,
  isTestcontainers,
  isLocal,
});

export const env: Env = Object.freeze({
  profile: PROFILE,
  baseUrl,
  apiUrl,
  mongoUrl: pick('MONGO_URL', defaults.mongoUrl),
  mongoDb: pick('MONGO_DB', 'bjjeire'),
  isCI,
  acceptInvalidCerts: readEnvFlag('ACCEPT_INVALID_CERTS', PROFILE === 'local' || PROFILE === 'docker'),
  context: runtimeContext,
  // In CI on ARC runner pods AZURE_TESTS_CLIENT_ID/_SECRET are typically
  // UNSET; the workload identity webhook injects AZURE_CLIENT_ID +
  // AZURE_FEDERATED_TOKEN_FILE and DefaultAzureCredential reads those.
  // The client secret is the local-dev fallback.
  azure: Object.freeze({
    tenantId: readEnv('AZURE_TENANT_ID'),
    clientId: readEnv('AZURE_TESTS_CLIENT_ID'),
    clientSecret: readEnv('AZURE_TESTS_CLIENT_SECRET'),
    apiScope: readEnv('AZURE_API_SCOPE'),
    authority: readEnv('AZURE_AUTHORITY'),
  }),
  cfAccess: Object.freeze({
    clientId: readEnv('CF_ACCESS_CLIENT_ID'),
    clientSecret: readEnv('CF_ACCESS_CLIENT_SECRET'),
  }),
  uiTestUser: Object.freeze({
    username: readEnv('PW_TEST_USER'),
    password: readEnv('PW_TEST_PASSWORD'),
  }),
});

/**
 * Full client-credentials config. Only required when the credential chain
 * (WIF, az CLI, managed identity) isn't available — i.e. local dev without
 * `az login`. ARC runner pods normally don't have these set.
 */
export function requireAzureConfig(): AzureConfig {
  const tenantId = readRequiredEnv('AZURE_TENANT_ID');
  return {
    tenantId,
    clientId: readRequiredEnv('AZURE_TESTS_CLIENT_ID'),
    clientSecret: readRequiredEnv('AZURE_TESTS_CLIENT_SECRET'),
    apiScope: readRequiredEnv('AZURE_API_SCOPE'),
    authority: env.azure.authority ?? `${DEFAULT_AZURE_AUTHORITY_PREFIX}/${tenantId}`,
  };
}

/**
 * Minimal config required for ANY auth strategy. The credential chain only
 * needs the tenant + scope; the client_secret path additionally needs the
 * full {@link requireAzureConfig}.
 */
export function requireApiAuthBasics(): ApiAuthBasics {
  const tenantId = readRequiredEnv('AZURE_TENANT_ID');
  return {
    tenantId,
    apiScope: readRequiredEnv('AZURE_API_SCOPE'),
    authority: env.azure.authority ?? `${DEFAULT_AZURE_AUTHORITY_PREFIX}/${tenantId}`,
  };
}
