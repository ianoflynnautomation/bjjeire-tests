export const UI_AUTH_TIMEOUTS = {
  flow: 60_000,
  /** Post-submit Entra screens (KMSI, consent) after a round trip. */
  prompt: 15_000,
  optionalStep: 5_000,
} as const;

export const ENTRA_LOGIN_HOST = 'login.microsoftonline.com';

export const ENTRA_LOGIN_HOSTS = [ENTRA_LOGIN_HOST, 'login.microsoft.com', 'login.windows.net'] as const;

export const ENTRA_SESSION_COOKIE_NAMES = ['ESTSAUTH', 'ESTSAUTHPERSISTENT', 'SignInStateCookie'] as const;

export const STORAGE_STATE_FILE_MODE = 0o600;
export const SESSION_EXPIRY_BUFFER_MS = 60_000;
export const SESSION_COOKIE_EXPIRES = -1;

export const OPENID_SCOPES = ['openid', 'profile', 'offline_access'] as const;

export const ENV_NAMES = {
  useEntra: ['PW_UI_USE_ENTRA', 'ENTRA_USE_SSO'],
  username: ['ENTRA_USER_EMAIL', 'PW_TEST_USER'],
  password: ['ENTRA_USER_PASSWORD', 'PW_TEST_PASSWORD'],
  tenantId: ['ENTRA_TENANT_ID', 'AZURE_TENANT_ID'],
  clientId: ['ENTRA_CLIENT_ID', 'AZURE_TESTS_CLIENT_ID'],
  clientSecret: ['ENTRA_CLIENT_SECRET', 'AZURE_TESTS_CLIENT_SECRET'],
} as const;

export const ENTRA_COPY = {
  emailField: /email|phone|skype/i,
  passwordField: /password/i,
  nextOrSignIn: /^(next|sign in)$/i,
  otherWays: /other ways to sign in/i,
  usePassword: /use (your )?password/i,
  staySignedIn: /stay signed in/i,
  kmsiYes: /^yes$/i,
  kmsiNo: /^no$/i,
  useAnotherAccount: /use another account/i,
  permissionsRequested: /permissions requested/i,
  accept: /^accept$/i,
} as const;
