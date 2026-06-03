import { mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { z } from 'zod';
import { AUTH_CONFIG } from './auth-config';
import type { CachedToken } from './auth-types';

const CachedTokenSchema = z
  .object({
    token: z.string().min(1),
    expiresAtMs: z.number().int().positive(),
  })
  .readonly();

const TokenCacheFileSchema = z.record(z.string().min(1), CachedTokenSchema);

type TokenCacheFile = z.infer<typeof TokenCacheFileSchema>;

const memoryCache = new Map<string, CachedToken>();

export function isFreshToken(entry: CachedToken | undefined): entry is CachedToken {
  return !!entry && entry.expiresAtMs - AUTH_CONFIG.expiryBufferMs > Date.now();
}

export function readMemoryToken(scopeKey: string): CachedToken | undefined {
  return memoryCache.get(scopeKey);
}

export function writeMemoryToken(scopeKey: string, entry: CachedToken): void {
  memoryCache.set(scopeKey, entry);
}

export function readDiskCache(): TokenCacheFile {
  let raw: string;
  try {
    raw = readFileSync(AUTH_CONFIG.cacheFile, 'utf-8');
  } catch {
    return {};
  }

  const json = parseTokenCacheJson(raw);
  if (json === undefined) return {};

  const result = TokenCacheFileSchema.safeParse(json);
  if (result.success) return result.data;

  console.warn(`[entra-token] discarding malformed cache at ${AUTH_CONFIG.cacheFile}: ${result.error.message}`);
  return {};
}

export function writeDiskCache(scopeKey: string, entry: CachedToken): void {
  const merged: Record<string, CachedToken> = { ...readDiskCache(), [scopeKey]: entry };
  const tmpPath = `${AUTH_CONFIG.cacheFile}.${process.pid}.tmp`;
  mkdirSync(dirname(AUTH_CONFIG.cacheFile), { recursive: true });
  writeFileSync(tmpPath, JSON.stringify(merged, null, 2), { mode: AUTH_CONFIG.fileMode });
  renameSync(tmpPath, AUTH_CONFIG.cacheFile);
}

export function persistToken(scopeKey: string, entry: CachedToken): CachedToken {
  writeMemoryToken(scopeKey, entry);
  writeDiskCache(scopeKey, entry);
  return entry;
}

export function clearTokenCacheForTests(): void {
  memoryCache.clear();
}

function parseTokenCacheJson(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`[entra-token] discarding invalid JSON cache at ${AUTH_CONFIG.cacheFile}: ${message}`);
    return undefined;
  }
}
