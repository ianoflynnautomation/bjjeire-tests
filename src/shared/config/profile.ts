import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import dotenv from 'dotenv';

export const PROFILES = ['local', 'docker', 'testcontainers', 'staging', 'production'] as const;
export type Profile = (typeof PROFILES)[number];

export function isProfile(value: string): value is Profile {
  return (PROFILES as readonly string[]).includes(value);
}

export function resolveProfile(): Profile {
  const raw = (process.env.APP_ENV ?? 'local').trim().toLowerCase();
  if (isProfile(raw)) return raw;
  throw new Error(`APP_ENV must be one of ${PROFILES.join(', ')} — got '${raw}'.`);
}

export function loadEnvForProfile(profile: Profile = resolveProfile(), cwd: string = process.cwd()): void {
  const candidateFiles = [`.env.${profile}.local`, `.env.${profile}`, `.env.local`, `.env`];
  for (const file of candidateFiles) {
    const fullPath = resolve(cwd, file);
    if (existsSync(fullPath)) {
      dotenv.config({ path: fullPath });
    }
  }
}
