import { mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { dirname, join as joinPath, parse as parsePath } from 'node:path';
import { z } from 'zod';
import {
  ENTRA_LOGIN_HOSTS,
  ENTRA_SESSION_COOKIE_NAMES,
  SESSION_COOKIE_EXPIRES,
  SESSION_EXPIRY_BUFFER_MS,
  STORAGE_STATE_FILE_MODE,
} from './microsoft.login.constants';
import { type StorageStateSnapshot } from './microsoft.login.types';

const StorageCookieSchema = z
  .object({
    name: z.string().min(1),
    domain: z.string().min(1),
    expires: z.number(),
  })
  .loose();

const StorageOriginSchema = z
  .object({
    origin: z.string().min(1),
    localStorage: z.array(z.object({ name: z.string(), value: z.string() })).default([]),
  })
  .loose();

const StorageStateSchema = z
  .object({
    cookies: z.array(StorageCookieSchema).default([]),
    origins: z.array(StorageOriginSchema).default([]),
  })
  .loose();

export function storageStatePathForWorker(basePath: string, workerIndex: number): string {
  if (workerIndex <= 0) return basePath;
  const { dir, name, ext } = parsePath(basePath);
  return joinPath(dir, `${name}.${workerIndex}${ext}`);
}

export function isStorageStateFresh(path: string): boolean {
  const state = readStorageState(path);
  if (!state) return false;
  return hasFreshSessionCookies(state) || hasInjectedMsalCache(state);
}

export function readStorageState(path: string): StorageStateSnapshot | undefined {
  let raw: string;
  try {
    raw = readFileSync(path, 'utf-8');
  } catch {
    return undefined;
  }

  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    return undefined;
  }

  const parsed = StorageStateSchema.safeParse(json);
  if (!parsed.success) return undefined;
  return parsed.data;
}

export function writeStorageStateAtomic(path: string, state: StorageStateSnapshot): void {
  const tmpPath = `${path}.${process.pid}.tmp`;
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(tmpPath, JSON.stringify(state, null, 2), { mode: STORAGE_STATE_FILE_MODE });
  renameSync(tmpPath, path);
}

export function hasUsableAuthState(state: StorageStateSnapshot): boolean {
  return state.cookies.length > 0 || hasInjectedMsalCache(state);
}

function hasFreshSessionCookies(state: StorageStateSnapshot): boolean {
  const minExpiry = Date.now() / 1000 + SESSION_EXPIRY_BUFFER_MS / 1000;
  return state.cookies.some(cookie => {
    if (!isEntraSessionCookie(cookie)) return false;
    return cookie.expires === SESSION_COOKIE_EXPIRES || cookie.expires > minExpiry;
  });
}

function isEntraSessionCookie(cookie: StorageStateSnapshot['cookies'][number]): boolean {
  const domain = cookie.domain.replace(/^\./, '').toLowerCase();
  const onEntraHost = ENTRA_LOGIN_HOSTS.some(host => domain === host || domain.endsWith(`.${host}`));
  const knownName = ENTRA_SESSION_COOKIE_NAMES.some(name => cookie.name === name);
  return onEntraHost || knownName;
}

function hasInjectedMsalCache(state: StorageStateSnapshot): boolean {
  return state.origins.some(origin => origin.localStorage.some(entry => isMsalCacheKey(entry.name)));
}

function isMsalCacheKey(name: string): boolean {
  return name.startsWith('msal.') || name.includes('-accesstoken-') || name.includes('-idtoken-');
}
