import { env } from '@shared/config';

const REQUIRED_PROFILE = 'staging';
const STAGING_HOST_MARKER = /staging/i;

export default async function globalSetup(): Promise<void> {
  if (env.profile !== REQUIRED_PROFILE) {
    throw new Error(
      `Security suite refused to run: APP_ENV='${env.profile}' is not permitted. ` +
        `Security tests must only run against '${REQUIRED_PROFILE}'. ` +
        `Set APP_ENV=${REQUIRED_PROFILE} and provide BASE_URL/API_URL pointing at staging.`,
    );
  }

  for (const rawUrl of [env.apiUrl, env.baseUrl]) {
    if (!rawUrl) continue;
    const host = new URL(rawUrl).host;
    if (!STAGING_HOST_MARKER.test(host)) {
      throw new Error(
        `Security suite refused to run: host '${host}' does not contain 'staging'. ` +
          `Configure BASE_URL/API_URL to point at the staging environment.`,
      );
    }
  }
}
