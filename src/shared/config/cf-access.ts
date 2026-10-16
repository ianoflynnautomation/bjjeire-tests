import { env } from './env';

export function hasCfAccessCredentials(): boolean {
  return !!env.cfAccess.clientId && !!env.cfAccess.clientSecret;
}

export function cfAccessHeaders(): Record<string, string> {
  const { clientId, clientSecret } = env.cfAccess;
  if (!clientId || !clientSecret) return {};
  return {
    'CF-Access-Client-Id': clientId,
    'CF-Access-Client-Secret': clientSecret,
  };
}
