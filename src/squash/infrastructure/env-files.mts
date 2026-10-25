/**
 * Reads `SQUASH_TM_*` from the env files the suite already uses, plus any other
 * `.env*.local`. Shared with `squash:prune` (native ESM). Only those keys are
 * copied, so a token kept in `.env.dev.local` does not change `APP_ENV` or
 * `BASE_URL`. A value already in the environment wins, and a blank line stays unset.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const SQUASH_PREFIX = 'SQUASH_TM_';
const EXPORT_PREFIX = 'export ';
/** Shell-only. It chooses the file order, so a value inside an env file cannot select that file. */
export const SQUASH_PROFILE_ENV = 'SQUASH_TM_PROFILE';

type EnvFile = readonly [name: string, text: string];

export type SquashEnvProfile = Readonly<{
  /** `.env.<profile>.local` is read before `.env.local`, `.env`, and any other `.env*.local`. */
  profile: string;
  source: 'SQUASH_TM_PROFILE' | 'APP_ENV' | 'default';
}>;

const PROFILE_REASON: Readonly<Record<SquashEnvProfile['source'], string>> = {
  SQUASH_TM_PROFILE: 'from SQUASH_TM_PROFILE',
  APP_ENV: 'from APP_ENV; set SQUASH_TM_PROFILE to choose the env file independently',
  default: 'neither SQUASH_TM_PROFILE nor APP_ENV is set',
};

/**
 * Which env file wins. `SQUASH_TM_PROFILE` is explicit. Otherwise this suite's
 * `APP_ENV` is used, so `npm run test:dev` reads `.env.dev.local` first. With
 * neither set, the profile is `local`.
 */
export function resolveSquashEnvProfile(env: NodeJS.ProcessEnv): SquashEnvProfile {
  const explicit = env[SQUASH_PROFILE_ENV]?.trim();
  if (explicit) return { profile: explicit.toLowerCase(), source: 'SQUASH_TM_PROFILE' };
  const app = env['APP_ENV']?.trim();
  if (app) return { profile: app.toLowerCase(), source: 'APP_ENV' };
  return { profile: 'local', source: 'default' };
}

/** Names the profile and the file each filled key came from. Values are never included. */
export function formatSquashEnvLoad(resolved: SquashEnvProfile, applied: ReadonlyMap<string, string>): string {
  const files =
    applied.size === 0
      ? 'no SQUASH_TM_* key was filled from an env file'
      : [...applied.entries()]
          .sort(([left], [right]) => left.localeCompare(right))
          .map(([key, file]) => `${key} from ${file}`)
          .join(', ');
  return `Env profile "${resolved.profile}" (${PROFILE_REASON[resolved.source]}). ${files}.`;
}

export function orderedSquashEnvFiles(names: readonly string[], profile: string): string[] {
  const present = names.filter(isEnvFile);
  const preferred = [`.env.${profile}.local`, `.env.${profile}`, '.env.local', '.env'];
  const rank = new Map(preferred.map((name, index) => [name, index]));
  return [...present].sort(
    (left, right) =>
      (rank.get(left) ?? preferred.length) - (rank.get(right) ?? preferred.length) || left.localeCompare(right),
  );
}

/** Copies unset `SQUASH_TM_*` keys. Returns the file that supplied each key it set. */
export function applySquashEnv(env: NodeJS.ProcessEnv, files: readonly EnvFile[]): Map<string, string> {
  const applied = new Map<string, string>();
  for (const [name, text] of files) {
    for (const [key, value] of parseSquashEnv(text)) {
      if (env[key]?.trim()) continue;
      env[key] = value;
      applied.set(key, name);
    }
  }
  return applied;
}

export function parseSquashEnv(text: string): [string, string][] {
  const entries: [string, string][] = [];
  for (const line of text.split('\n')) {
    const parsed = parseLine(line);
    if (parsed !== undefined) entries.push(parsed);
  }
  return entries;
}

export function readSquashEnvFiles(cwd: string, profile: string): EnvFile[] {
  let names: string[] = [];
  try {
    names = readdirSync(cwd, { withFileTypes: true })
      .filter(entry => entry.isFile())
      .map(entry => entry.name);
  } catch {
    return [];
  }
  return orderedSquashEnvFiles(names, profile).flatMap(name => readEnvFile(cwd, name));
}

function readEnvFile(cwd: string, name: string): EnvFile[] {
  try {
    return [[name, readFileSync(join(cwd, name), 'utf8')]];
  } catch {
    return [];
  }
}

function isEnvFile(name: string): boolean {
  return name === '.env' || name === '.env.local' || (name.startsWith('.env.') && name.endsWith('.local'));
}

function parseLine(line: string): [string, string] | undefined {
  const trimmed = line.trim();
  if (trimmed === '' || trimmed.startsWith('#')) return undefined;
  const body = trimmed.startsWith(EXPORT_PREFIX) ? trimmed.slice(EXPORT_PREFIX.length).trim() : trimmed;
  const separator = body.indexOf('=');
  if (separator <= 0) return undefined;
  const key = body.slice(0, separator).trim();
  if (!key.startsWith(SQUASH_PREFIX)) return undefined;
  const value = unquote(body.slice(separator + 1).trim());
  return value === '' ? undefined : [key, value];
}

function unquote(value: string): string {
  const quote = value[0];
  if ((quote === '"' || quote === "'") && value.length >= 2 && value.endsWith(quote)) return value.slice(1, -1);
  return value;
}
