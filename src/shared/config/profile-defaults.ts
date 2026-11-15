import type { Profile } from './profile';

export type FlagState = 'on' | 'off';

export type ProfileDefaults = Readonly<{
  baseUrl: string;
  apiUrl: string;
  /**
   * Whether the environment's API serves tournaments (`FEATURE_TOURNAMENTS`). `undefined` = unknown, so a
   * run selects neither tournament set until `TOURNAMENTS_FLAG` says. Docker: the compose file defaults it
   * off (a stack started with FEATURE_TOURNAMENTS=true needs TOURNAMENTS_FLAG=on). Local (minikube), dev and staging: the gitops
   * values never set it, so the API default (off) applies.
   */
  tournaments: FlagState | undefined;
}>;

export const PROFILE_DEFAULTS: Readonly<Record<Profile, ProfileDefaults>> = {
  local: { baseUrl: 'http://localhost:3000', apiUrl: 'http://localhost:5000', tournaments: 'off' },
  docker: { baseUrl: 'http://localhost:3000', apiUrl: 'http://localhost:5003', tournaments: 'off' },
  dev: { baseUrl: '', apiUrl: '', tournaments: 'off' },
  staging: { baseUrl: '', apiUrl: '', tournaments: 'off' },
};

const REMOTE_PROFILES: readonly Profile[] = ['dev', 'staging'];
const PRODUCTION_HOSTS: readonly string[] = ['bjjeire.com', 'www.bjjeire.com', 'api.bjjeire.com'];

export function isProductionUrl(url: string): boolean {
  return URL.canParse(url) && PRODUCTION_HOSTS.includes(new URL(url).hostname.toLowerCase());
}

export function isRemoteProfile(profile: Profile): boolean {
  return REMOTE_PROFILES.includes(profile);
}
