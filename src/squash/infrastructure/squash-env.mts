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

type EnvFile = readonly [name: string, text: string];

export function orderedSquashEnvFiles(names: readonly string[], profile: string): string[] {
  const present = names.filter(isEnvFile);
  const preferred = [`.env.${profile}.local`, `.env.${profile}`, '.env.local', '.env'];
  const rank = new Map(preferred.map((name, index) => [name, index]));
  return [...present].sort(
    (left, right) =>
      (rank.get(left) ?? preferred.length) - (rank.get(right) ?? preferred.length) || left.localeCompare(right),
  );
}

export function applySquashEnv(env: NodeJS.ProcessEnv, files: readonly EnvFile[]): void {
  for (const [, text] of files) {
    for (const [key, value] of parseSquashEnv(text)) {
      if (env[key]?.trim()) continue;
      env[key] = value;
    }
  }
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
