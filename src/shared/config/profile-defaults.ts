import type { Profile } from './profile';

export type ProfileDefaults = Readonly<{
  baseUrl: string;
  apiUrl: string;
}>;

export const PROFILE_DEFAULTS: Readonly<Record<Profile, ProfileDefaults>> = {
  local: { baseUrl: 'http://localhost:3000', apiUrl: 'http://localhost:5000' },
  docker: { baseUrl: 'http://localhost:3000', apiUrl: 'http://localhost:5003' },
  dev: { baseUrl: '', apiUrl: '' },
  staging: { baseUrl: '', apiUrl: '' },
};

const REMOTE_PROFILES: readonly Profile[] = ['dev', 'staging'];

export function isRemoteProfile(profile: Profile): boolean {
  return REMOTE_PROFILES.includes(profile);
}
