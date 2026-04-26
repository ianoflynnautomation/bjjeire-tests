import { request } from '@playwright/test';
import type { FeatureFlagMap } from '../../api/support/api/schemas';
import { featureFlagMapSchema } from '../../api/support/api/schemas';
import { env } from '../../shared/config/env';

export async function loadFeatureFlags(): Promise<FeatureFlagMap> {
  const ctx = await request.newContext({
    baseURL: env.apiUrl,
    ignoreHTTPSErrors: env.acceptInvalidCerts,
    extraHTTPHeaders: {
      'content-type': 'application/json',
      accept: 'application/json',
    },
  });

  try {
    const response = await ctx.get('/api/v1/FeatureFlag');
    if (!response.ok()) {
      throw new Error(`GET /api/v1/FeatureFlag returned ${response.status()}`);
    }

    const payload = featureFlagMapSchema.safeParse(await response.json());
    if (!payload.success) {
      const issues = payload.error.issues
        .map(issue => `${issue.path.join('.') || '(root)'}: ${issue.message}`)
        .join('; ');
      throw new Error(`Feature flag response failed schema validation: ${issues}`);
    }

    return payload.data;
  } finally {
    await ctx.dispose();
  }
}
