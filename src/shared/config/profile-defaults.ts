import type { Profile } from './profile';

export type FlagState = 'on' | 'off';

export type ProfileDefaults = Readonly<{
  baseUrl: string;
  apiUrl: string;
  /**
   * Whether the environment's API serves BJJ Éire competitions (`FEATURE_BJJEIRE_COMPETITIONS`, flag
   * `BjjEireCompetitions`). `undefined` = unknown, so a run selects neither flag-dependent set until
   * `BJJEIRE_COMPETITIONS_FLAG` says. Local and Docker: on, because the acceptance stacks run with the flag on (a
   * stack started with the compose default, off, needs BJJEIRE_COMPETITIONS_FLAG=off). Dev and staging: the gitops
   * values never set it, so the API default (off) applies.
   */
  bjjEireCompetitions: FlagState | undefined;
  /**
   * Whether the API issues a competitor token to any email through its local sign-in route
   * (`bjjeire.local-sign-in.enabled`, local profile only). On for local and Docker stacks, off for dev and staging.
   */
  localSignIn: FlagState;
}>;

export const PROFILE_DEFAULTS: Readonly<Record<Profile, ProfileDefaults>> = {
  local: {
    baseUrl: 'http://localhost:3000',
    apiUrl: 'http://localhost:5000',
    bjjEireCompetitions: 'on',
    localSignIn: 'on',
  },
  docker: {
    baseUrl: 'http://localhost:3000',
    apiUrl: 'http://localhost:5003',
    bjjEireCompetitions: 'on',
    localSignIn: 'on',
  },
  dev: { baseUrl: '', apiUrl: '', bjjEireCompetitions: 'off', localSignIn: 'off' },
  staging: { baseUrl: '', apiUrl: '', bjjEireCompetitions: 'off', localSignIn: 'off' },
};

const REMOTE_PROFILES: readonly Profile[] = ['dev', 'staging'];
const PRODUCTION_HOSTS: readonly string[] = ['bjjeire.com', 'www.bjjeire.com', 'api.bjjeire.com'];

export function isProductionUrl(url: string): boolean {
  return URL.canParse(url) && PRODUCTION_HOSTS.includes(new URL(url).hostname.toLowerCase());
}

export function isRemoteProfile(profile: Profile): boolean {
  return REMOTE_PROFILES.includes(profile);
}
