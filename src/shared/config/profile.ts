import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import dotenv from 'dotenv';
import { InvalidProfileError } from './config-errors';
import { readEnv } from './process-env';

export const PROFILES = ['local', 'docker', 'dev', 'staging'] as const;
export type Profile = (typeof PROFILES)[number];

function isProfile(value: string): value is Profile {
  return PROFILES.some(profile => profile === value);
}

export function resolveProfile(): Profile {
  const raw = (readEnv('APP_ENV') ?? 'local').toLowerCase();
  if (isProfile(raw)) return raw;
  throw new InvalidProfileError(raw, PROFILES);
}

export function loadEnvForProfile(profile: Profile = resolveProfile(), cwd: string = process.cwd()): void {
  for (const file of [`.env.${profile}.local`, `.env.${profile}`, `.env.local`, `.env`]) {
    const fullPath = resolve(cwd, file);
    if (existsSync(fullPath)) dotenv.config({ path: fullPath });
  }
}
