import { InvalidEnvVarError, MissingProfileUrlError, ProductionTargetError } from './config-errors';
import { isProductionUrl, isRemoteProfile, PROFILE_DEFAULTS, type FlagState } from './profile-defaults';
import { loadEnvForProfile, resolveProfile, type Profile } from './profile';
import { readEnv, readEnvFlag, readRequiredEnv } from './process-env';

const PROFILE: Profile = resolveProfile();
loadEnvForProfile(PROFILE);

const DEFAULT_AZURE_AUTHORITY_PREFIX = 'https://login.microsoftonline.com';

export type AzureConfig = Readonly<{
  tenantId: string;
  clientId: string;
  clientSecret: string;
  apiScope: string;
  authority: string;
}>;

export type ExecutionContext = 'arc-runner' | 'ci-hosted' | 'local';

export type RuntimeContext = Readonly<{
  executionContext: ExecutionContext;
  isInCluster: boolean;
  hasWorkloadIdentity: boolean;
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
  required: boolean;
}>;

type OptionalUserCredentials = Readonly<{
  username: string | undefined;
  password: string | undefined;
  entraEnabled: boolean;
  storageStatePath: string | undefined;
}>;

export type Env = Readonly<{
  profile: Profile;
  baseUrl: string;
  apiUrl: string;
  /** Does the environment's API serve tournaments? `undefined` = unknown, see `TOURNAMENTS_FLAG`. */
  tournamentsFlag: FlagState | undefined;
  /** Does the API issue a competitor token to any email? See `LOCAL_SIGN_IN`. */
  localSignIn: FlagState;
  isCI: boolean;
  acceptInvalidCerts: boolean;
  context: RuntimeContext;
  apiAuth: Readonly<{
    required: boolean;
  }>;
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

const defaults = PROFILE_DEFAULTS[PROFILE];

const baseUrl = stripTrailingSlash(pick('BASE_URL', defaults.baseUrl));
const apiUrl = stripTrailingSlash(pick('API_URL', defaults.apiUrl));

function readFlagState(name: string, fallback: FlagState | undefined): FlagState | undefined {
  const raw = readEnv(name)?.toLowerCase();
  if (raw === undefined) return fallback;
  if (raw === 'on' || raw === 'off') return raw;
  throw new InvalidEnvVarError(name, raw, 'on or off');
}

if (isProductionUrl(baseUrl)) throw new ProductionTargetError('BASE_URL', baseUrl);
if (isProductionUrl(apiUrl)) throw new ProductionTargetError('API_URL', apiUrl);

if (isRemoteProfile(PROFILE)) {
  if (!baseUrl) throw new MissingProfileUrlError(PROFILE, 'BASE_URL');
  if (!apiUrl) throw new MissingProfileUrlError(PROFILE, 'API_URL');
}

// =====================================================================
// Execution-context detection
// =====================================================================
// Used by tests to make environment-aware decisions like
// `test.skip(env.context.isLocal, 'requires CI environment')`. All signals are derived
// from environment variables that the runtime sets for us — no heuristics.

const isCI = readEnv('CI') !== undefined;
// AZURE_FEDERATED_TOKEN_FILE is injected by the Azure Workload Identity
// webhook into pods that have the right label/annotation. Its presence is
// the canonical signal that we're running with a workload identity.
const hasWorkloadIdentity = readEnv('AZURE_FEDERATED_TOKEN_FILE') !== undefined;
// KUBERNETES_SERVICE_HOST is set inside every pod regardless of WI config.
const isInCluster = hasWorkloadIdentity || readEnv('KUBERNETES_SERVICE_HOST') !== undefined;
const isLocal = !isCI && !isInCluster;

const executionContext: ExecutionContext = hasWorkloadIdentity ? 'arc-runner' : isCI ? 'ci-hosted' : 'local';

// =====================================================================
// Optional-field convention
// =====================================================================
// Every secret/credential block uses `string | undefined` rather than `string`
// with `''` sentinels. With `exactOptionalPropertyTypes` on, this lets callers
// pattern-match cleanly: `if (env.cfAccess.clientId) { ... }`. The `requireX`
// helpers below throw when the field is absent and the caller can't proceed.

const runtimeContext: RuntimeContext = Object.freeze({
  executionContext,
  isInCluster,
  hasWorkloadIdentity,
  isLocal,
});

// Only default to "credentials required" when targeting a remote/protected
// environment. CI runs against the local Docker Compose stack (APP_ENV=docker)
// don't have Entra/CF Access in front of them, so the api-setup probe would
// otherwise demand AZURE_API_SCOPE etc. for no reason. Callers can still
// override explicitly via API_AUTH_REQUIRED / CF_ACCESS_REQUIRED.
const requireProtectedPipelineCredentials = (isCI || isInCluster) && isRemoteProfile(PROFILE);

export const env: Env = Object.freeze({
  profile: PROFILE,
  baseUrl,
  apiUrl,
  tournamentsFlag: readFlagState('TOURNAMENTS_FLAG', defaults.tournaments),
  localSignIn: readFlagState('LOCAL_SIGN_IN', defaults.localSignIn) ?? defaults.localSignIn,
  isCI,
  acceptInvalidCerts: readEnvFlag('ACCEPT_INVALID_CERTS', PROFILE === 'local' || PROFILE === 'docker'),
  context: runtimeContext,
  apiAuth: Object.freeze({
    required: readEnvFlag('API_AUTH_REQUIRED', requireProtectedPipelineCredentials),
  }),
  // bjjeire-tests app registration (main.app-registrations.tf):
  // AZURE_TESTS_CLIENT_ID, AZURE_TESTS_CLIENT_SECRET, AZURE_TENANT_ID, AZURE_API_SCOPE.
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
    required: readEnvFlag('CF_ACCESS_REQUIRED', requireProtectedPipelineCredentials),
  }),
  uiTestUser: Object.freeze({
    username: readEnv('PW_TEST_USER'),
    password: readEnv('PW_TEST_PASSWORD'),
    entraEnabled: readEnvFlag('PW_UI_ENTRA_AUTH', false),
    storageStatePath: readEnv('PW_UI_STORAGE_STATE'),
  }),
});

/** Client-credentials config for the bjjeire-tests app registration. */
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
