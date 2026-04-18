import { loadEnvForProfile, resolveProfile, type Profile } from './profile';

loadEnvForProfile();

function stripTrailingSlash(value: string): string {
  return value.endsWith('/') ? value.slice(0, -1) : value;
}

function readOptional(name: string, fallback: string): string {
  const raw = process.env[name]?.trim();
  return raw && raw.length > 0 ? raw : fallback;
}

function readRequired(name: string): string {
  const raw = process.env[name]?.trim();
  if (!raw) throw new Error(`Required env var ${name} is not set`);
  return raw;
}

function readFlag(name: string, fallback: boolean): boolean {
  const raw = process.env[name]?.trim().toLowerCase();
  if (!raw) return fallback;
  return raw === 'true' || raw === '1' || raw === 'yes';
}

const PROFILE: Profile = resolveProfile();

const PROFILE_DEFAULTS: Record<Profile, { baseUrl: string; apiUrl: string; mongoUrl: string }> = {
  local: {
    baseUrl: 'http://localhost:3000',
    apiUrl: 'http://localhost:5000',
    mongoUrl: 'mongodb://localhost:27017',
  },
  docker: {
    baseUrl: 'http://localhost:3000',
    apiUrl: 'http://localhost:5000',
    mongoUrl: 'mongodb://localhost:27017',
  },
  testcontainers: {
    baseUrl: 'http://localhost:3000',
    apiUrl: 'http://localhost:5000',
    mongoUrl: '',
  },
  staging: {
    baseUrl: '',
    apiUrl: '',
    mongoUrl: '',
  },
  production: {
    baseUrl: '',
    apiUrl: '',
    mongoUrl: '',
  },
};

const defaults = PROFILE_DEFAULTS[PROFILE];

export const env = {
  profile: PROFILE,
  baseUrl: stripTrailingSlash(readOptional('BASE_URL', defaults.baseUrl)),
  apiUrl: stripTrailingSlash(readOptional('API_URL', defaults.apiUrl)),
  mongoUrl: readOptional('MONGO_URL', defaults.mongoUrl),
  mongoDb: readOptional('MONGO_DB', 'bjjeire'),
  isCI: !!process.env.CI,
  acceptInvalidCerts: readFlag('ACCEPT_INVALID_CERTS', PROFILE === 'local' || PROFILE === 'docker'),
  azure: {
    tenantId: process.env.AZURE_TENANT_ID?.trim() ?? '',
    clientId: process.env.AZURE_CLIENT_ID?.trim() ?? '',
    clientSecret: process.env.AZURE_CLIENT_SECRET?.trim() ?? '',
    apiScope: process.env.AZURE_API_SCOPE?.trim() ?? '',
    authority: process.env.AZURE_AUTHORITY?.trim() ?? '',
  },
} as const;

export type Env = typeof env;

export function requireAzureConfig(): {
  tenantId: string;
  clientId: string;
  clientSecret: string;
  apiScope: string;
  authority: string;
} {
  return {
    tenantId: readRequired('AZURE_TENANT_ID'),
    clientId: readRequired('AZURE_CLIENT_ID'),
    clientSecret: readRequired('AZURE_CLIENT_SECRET'),
    apiScope: readRequired('AZURE_API_SCOPE'),
    authority: env.azure.authority || `https://login.microsoftonline.com/${readRequired('AZURE_TENANT_ID')}`,
  };
}
