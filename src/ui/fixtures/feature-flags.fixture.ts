import type { Page } from '@playwright/test';

// Mirrors TEST_OVERRIDES_GLOBAL in the app repo
// (`src/features/feature-flags/resolve.ts`). The app resolves flags at boot as
// DEFAULT_FLAGS -> remote -> these overrides, so this layer always wins.
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

// Every UI acceptance spec exercises a feature page, so all four are on. The
// app's own defaults are fail-closed: if the remote fetch fails, every feature
// route redirects to /about and the spec fails somewhere far from the cause.
// Feature availability is a precondition of these specs, not their subject —
// pinning it here keeps the suite independent of the flag backend.
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
