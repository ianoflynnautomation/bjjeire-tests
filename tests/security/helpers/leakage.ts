import { expect } from '@playwright/test';

const LEAK_PATTERNS: readonly { readonly label: string; readonly pattern: RegExp }[] = [
  // Stack traces
  { label: 'stack trace frame (.NET)', pattern: /\bat\s+[A-Za-z_][\w.]*\s+in\s+.*:line\s+\d+/i },
  { label: 'stack trace frame (JS)', pattern: /\n\s+at\s+\S+.*:\d+:\d+/ },

  // Internal namespaces
  { label: 'internal namespace', pattern: /\bBjjEire\.(?:Application|Infrastructure|Domain)\b/ },

  // Connection strings & secrets
  { label: 'MongoDB connection string', pattern: /mongodb(?:\+srv)?:\/\/[^"\s]+/i },
  { label: 'SQL connection string', pattern: /(?:Server|Data Source)=[^;"\s]+;/i },
  { label: 'JWT token', pattern: /eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/ },

  // Cloud credentials
  { label: 'AWS access key', pattern: /\bAKIA[0-9A-Z]{16}\b/ },
  { label: 'AWS secret key', pattern: /(?:aws_secret_access_key|secret_access_key)\s*[=:]\s*\S+/i },
  { label: 'Azure storage key', pattern: /DefaultEndpointsProtocol=https?;AccountName=/i },
  { label: 'Azure client secret', pattern: /(?:client_secret|clientSecret)\s*[=:]\s*["']?[A-Za-z0-9~._-]{30,}/i },
  { label: 'GCP service account key', pattern: /"type"\s*:\s*"service_account"/i },

  // Network internals
  { label: 'private IPv4', pattern: /\b(?:10|192\.168|172\.(?:1[6-9]|2\d|3[01]))\.\d{1,3}\.\d{1,3}\b/ },

  // Environment / config leakage
  { label: '.env file content', pattern: /^[A-Z_]{3,}=\S+/m },
  { label: 'GraphQL introspection', pattern: /__schema|__type/i },
];

export function expectNoSensitiveLeakage(body: string, context: string): void {
  for (const { label, pattern } of LEAK_PATTERNS) {
    expect(body, `${context} leaks ${label}: pattern ${pattern}`).not.toMatch(pattern);
  }
}
