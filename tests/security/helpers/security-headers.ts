import { expect, type APIResponse } from '@playwright/test';

export type HeaderExpectation = Readonly<{
  name: string;
  required: boolean;
  matcher?: RegExp | string;
  forbidden?: RegExp;
}>;

/**
 * Mirrors `SecurityHeadersExtensions.cs` on the API. Update both together.
 *
 * HSTS: 1-year max-age, includeSubDomains (no preload).
 * CSP: default-src 'self', object-src 'none', form-action 'self',
 *      frame-ancestors 'none', script-src 'self', style-src 'self',
 *      img-src 'self' data: https:, font-src 'self',
 *      connect-src 'self' https://login.microsoftonline.com.
 */
export const PUBLIC_HEADER_PROFILE: readonly HeaderExpectation[] = [
  { name: 'strict-transport-security', required: true, matcher: /max-age=31536000/ },
  { name: 'strict-transport-security', required: true, matcher: /includeSubDomains/i },
  { name: 'x-content-type-options', required: true, matcher: 'nosniff' },
  { name: 'referrer-policy', required: true, matcher: /no-referrer/i },
  { name: 'x-xss-protection', required: true, matcher: /1\s*;\s*mode=block/i },
  { name: 'permissions-policy', required: true },
  { name: 'content-security-policy', required: true, matcher: /default-src\s+'self'/i },
  { name: 'content-security-policy', required: true, matcher: /object-src\s+'none'/i },
  { name: 'content-security-policy', required: true, matcher: /form-action\s+'self'/i },
  { name: 'content-security-policy', required: true, matcher: /frame-ancestors\s+'none'/i },
  { name: 'content-security-policy', required: true, matcher: /script-src\s+'self'/i },
  { name: 'content-security-policy', required: true, matcher: /style-src\s+'self'/i },
  {
    name: 'content-security-policy',
    required: true,
    matcher: /connect-src\s+'self'\s+https:\/\/login\.microsoftonline\.com/i,
  },
  { name: 'x-frame-options', required: true, matcher: /DENY/i },
  { name: 'server', required: false, forbidden: /Kestrel|Microsoft-IIS|nginx\/[\d.]+/i },
  { name: 'x-powered-by', required: false, forbidden: /.+/ },
] as const;

export function expectHeaderProfile(
  response: APIResponse,
  profile: readonly HeaderExpectation[] = PUBLIC_HEADER_PROFILE,
): void {
  const headers = response.headers();

  for (const expectation of profile) {
    const actual = headers[expectation.name.toLowerCase()];

    if (expectation.forbidden) {
      if (actual !== undefined) {
        expect(actual, `header '${expectation.name}' leaks value '${actual}'`).not.toMatch(expectation.forbidden);
      }
      continue;
    }

    if (!expectation.required) continue;

    expect(actual, `required header '${expectation.name}' missing`).toBeDefined();

    if (expectation.matcher !== undefined && actual !== undefined) {
      if (expectation.matcher instanceof RegExp) {
        expect(actual).toMatch(expectation.matcher);
      } else {
        expect(actual).toContain(expectation.matcher);
      }
    }
  }
}
