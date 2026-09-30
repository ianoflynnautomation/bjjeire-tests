import type { Page } from '@playwright/test';

const TEST_FLAG_OVERRIDES_GLOBAL = '__BJJEIRE_TEST_FLAG_OVERRIDES__';

/* eslint-disable @typescript-eslint/naming-convention --
   Flag names are the backend's wire contract (`/api/v1/featureflag`) and the
   app's `FeatureFlagName` union; renaming them here would stop them matching. */
export type FeatureFlagOverrides = {
  BjjEvents: boolean;
  Gyms: boolean;
  Competitions: boolean;
  Stores: boolean;
};

export const ALL_FEATURES_ENABLED: FeatureFlagOverrides = {
  BjjEvents: true,
  Gyms: true,
  Competitions: true,
  Stores: true,
};
/* eslint-enable @typescript-eslint/naming-convention */

export async function stubFeatureFlags(page: Page, flags: FeatureFlagOverrides = ALL_FEATURES_ENABLED): Promise<void> {
  // addInitScript runs before any page script on every navigation, so the
  // global is in place before `bootstrap()` reads it.
  await page.addInitScript(
    ({ key, value }: { key: string; value: FeatureFlagOverrides }) => {
      (window as unknown as Record<string, unknown>)[key] = value;
    },
    { key: TEST_FLAG_OVERRIDES_GLOBAL, value: flags },
  );
}
