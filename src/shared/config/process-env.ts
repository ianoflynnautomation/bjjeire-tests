import { InvalidEnvVarError, MissingEnvVarError } from './config-errors';

const TRUE_VALUES = new Set(['true', '1', 'yes']);
const FALSE_VALUES = new Set(['false', '0', 'no']);

/**
 * Read an environment variable. Trims whitespace; returns `undefined` for
 * unset or empty values so callers can use truthy checks uniformly.
 */
export function readEnv(name: string): string | undefined {
  const raw = process.env[name]?.trim();
  return raw && raw.length > 0 ? raw : undefined;
}

/**
 * Read an environment variable that must be set. Throws with the variable
 * name in the message so the failure mode is obvious in CI logs.
 */
export function readRequiredEnv(name: string): string {
  const value = readEnv(name);
  if (value === undefined) throw new MissingEnvVarError(name);
  return value;
}

/**
 * Read a boolean-coded environment variable. Empty / missing falls back to
 * the supplied default; "true" / "1" / "yes" (case-insensitive) → true.
 */
export function readEnvFlag(name: string, fallback: boolean): boolean {
  const raw = readEnv(name)?.toLowerCase();
  if (raw === undefined) return fallback;
  if (TRUE_VALUES.has(raw)) return true;
  if (FALSE_VALUES.has(raw)) return false;
  throw new InvalidEnvVarError(name, raw, 'one of true, false, 1, 0, yes, no');
}
