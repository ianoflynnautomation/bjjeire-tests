export const AUTH_CONFIG = {
  cacheFile: 'playwright/.auth/api-tokens.json',
  expiryBufferMs: 60_000,
  fileMode: 0o600,
  fallthroughErrorNames: new Set<string>(['CredentialUnavailableError', 'AggregateAuthenticationError']),
} as const;
