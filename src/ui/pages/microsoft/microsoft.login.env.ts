import { env, readEnv, readEnvFlag } from '@shared/config';
import { ENV_NAMES } from './microsoft.login.constants';
import { type Credentials } from './microsoft.login.types';

export function resolveUseEntra(explicit: boolean | undefined): boolean {
  if (explicit !== undefined) return explicit;
  for (const name of ENV_NAMES.useEntra) {
    if (readEnv(name) !== undefined) return readEnvFlag(name, false);
  }
  return false;
}

export function resolveCredentials(workerIndex: number | undefined): Credentials {
  const suffix = workerIndex !== undefined && workerIndex > 0 ? `_${workerIndex}` : '';
  const username = workerUser(ENV_NAMES.username, suffix) ?? env.uiTestUser.username;
  const password = workerUser(ENV_NAMES.password, suffix) ?? env.uiTestUser.password;
  if (!username || !password) {
    throw new Error(
      'PW_TEST_USER and PW_TEST_PASSWORD (or ENTRA_USER_EMAIL / ENTRA_USER_PASSWORD) must be set to run the auth setup project.',
    );
  }
  return { username, password };
}

export function firstEnv(names: readonly string[]): string | undefined {
  for (const name of names) {
    const value = readEnv(name);
    if (value) return value;
  }
  return undefined;
}

function workerUser(names: readonly string[], suffix: string): string | undefined {
  return firstEnv(names.map(name => `${name}${suffix}`)) ?? firstEnv(names);
}
