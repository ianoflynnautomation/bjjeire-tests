export type CachedToken = Readonly<{
  token: string;
  expiresAtMs: number;
}>;

// 'chain' = DefaultAzureCredential (workload identity in pods, az CLI locally).
// 'client-credentials' = the bjjeire-tests SP secret.
export type AuthStrategy = 'chain' | 'client-credentials';
