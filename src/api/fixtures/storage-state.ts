import path from 'node:path';
import { existsSync } from 'node:fs';

export const AUTH_STATE_DIR = path.resolve(process.cwd(), 'playwright/.auth');

export const AUTH_ROLES = ['anonymous', 'member', 'admin'] as const;

export type AuthRole = (typeof AUTH_ROLES)[number];

const AUTH_STATE_FILES: Record<Exclude<AuthRole, 'anonymous'>, string> = {
  member: path.join(AUTH_STATE_DIR, 'member.json'),
  admin: path.join(AUTH_STATE_DIR, 'admin.json'),
};

export function storageStatePathForRole(role: AuthRole): string | undefined {
  if (role === 'anonymous') {
    return undefined;
  }

  return AUTH_STATE_FILES[role];
}

export function hasStorageStateForRole(role: AuthRole): boolean {
  const filePath = storageStatePathForRole(role);
  return typeof filePath === 'string' && existsSync(filePath);
}
