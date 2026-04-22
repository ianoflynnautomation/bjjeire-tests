import * as fs from 'node:fs';
import * as path from 'node:path';
import dotenv from 'dotenv';

export const PROFILES = ['local', 'docker', 'testcontainers', 'staging', 'production'] as const;
export type Profile = (typeof PROFILES)[number];

export function resolveProfile(): Profile {
  const raw = (process.env.APP_ENV ?? 'local').trim().toLowerCase();
  if ((PROFILES as readonly string[]).includes(raw)) return raw as Profile;
  throw new Error(`APP_ENV must be one of ${PROFILES.join(', ')} — got '${raw}'.`);
}

export function loadEnvForProfile(profile: Profile = resolveProfile(), cwd: string = process.cwd()): void {
  const files = [`.env.${profile}.local`, `.env.${profile}`, `.env.local`, `.env`];
  for (const file of files) {
    const fullPath = path.resolve(cwd, file);
    if (fs.existsSync(fullPath)) dotenv.config({ path: fullPath });
  }
}

export function isContainerProfile(profile: Profile = resolveProfile()): boolean {
  return profile === 'testcontainers';
}
