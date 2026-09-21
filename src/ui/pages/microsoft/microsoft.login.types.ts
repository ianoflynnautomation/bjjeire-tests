export type Credentials = Readonly<{ username: string; password: string }>;

/**
 * Dual auth switch for the Entra setup helper.
 * - `useEntra: false` (default) — drive the Microsoft login UI.
 * - `useEntra: true` — reuse a fresh storageState / inject tokens, fall back to UI.
 */
export type AuthenticateOptions = Readonly<{
  useEntra?: boolean;
  workerIndex?: number;
}>;

export type ResolvedAuth = Readonly<{
  credentials: Credentials;
  storageStatePath: string;
  useEntra: boolean;
  staySignedIn: boolean;
}>;

export type StorageStateCookie = Readonly<{
  name: string;
  domain: string;
  expires: number;
}>;

export type StorageStateOrigin = Readonly<{
  origin: string;
  localStorage: readonly Readonly<{ name: string; value: string }>[];
}>;

export type StorageStateSnapshot = Readonly<{
  cookies: readonly StorageStateCookie[];
  origins: readonly StorageStateOrigin[];
}>;

export type MsalTokenCache = Readonly<{
  cache: Readonly<Record<string, string>>;
  expiresAtMs: number;
}>;
