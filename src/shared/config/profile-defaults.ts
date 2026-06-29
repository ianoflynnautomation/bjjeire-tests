import type { Profile } from './profile';

export type ProfileDefaults = Readonly<{
  baseUrl: string;
  apiUrl: string;
  mongoUrl: string;
}>;

export const PROFILE_DEFAULTS: Readonly<Record<Profile, ProfileDefaults>> = {
  local: {
    baseUrl: 'http://localhost:3000',
    apiUrl: 'http://localhost:5000',
    mongoUrl: 'mongodb://localhost:27017',
  },
  docker: {
    baseUrl: 'http://localhost:3000',
    apiUrl: 'http://localhost:5003',
    mongoUrl: 'mongodb://localhost:27017',
  },
  dev: { baseUrl: '', apiUrl: '', mongoUrl: '' },
  staging: { baseUrl: '', apiUrl: '', mongoUrl: '' },
  production: { baseUrl: '', apiUrl: '', mongoUrl: '' },
};

export const REMOTE_PROFILES: readonly Profile[] = ['dev', 'staging', 'production'];

export function isRemoteProfile(profile: Profile): boolean {
  return REMOTE_PROFILES.includes(profile);
}
