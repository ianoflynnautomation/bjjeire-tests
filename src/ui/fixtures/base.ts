import { test as base, expect } from '@playwright/test';
import { buildTraceHeaders, testTraceContext, traceAnnotations } from '@shared/otel/trace-context';
import { ALL_FEATURES_ENABLED, stubFeatureFlags, type FeatureFlagOverrides } from './feature-flags.fixture';
import {
  footerSectionFixture,
  headerSectionFixture,
  supportModalFixture,
  type FooterSection,
  type HeaderSection,
  type SupportModal,
} from './sections.fixture';

/**
 * Cross-cutting fixtures only: app chrome and the feature-flag option.
 * A feature's own page object and route mocks live in that feature's fixture
 * module (`@ui/fixtures/gyms`, …) which extends this one — so adding or removing
 * a feature never edits a shared file.
 */
export type CoreUiFixtures = {
  /**
   * Which feature flags the app boots with. An *option*, not a plain fixture, so
   * a spec can narrow it for its own file:
   *   test.use({ featureFlagOverrides: { ...ALL_FEATURES_ENABLED, Stores: false } });
   * Everything else keeps the pinned-on default.
   */
  featureFlagOverrides: FeatureFlagOverrides;
  featureFlags: void;
  headerSection: HeaderSection;
  footerSection: FooterSection;
  supportModal: SupportModal;
};

export const test = base.extend<CoreUiFixtures>({
  // Layers the per-test traceparent onto whatever `use` already declared, rather
  // than rebuilding it: re-deriving the CF Access headers here would duplicate
  // the config's decision and silently drop anything later added to `use`.
  extraHTTPHeaders: async ({ extraHTTPHeaders }, use, testInfo) => {
    const trace = testTraceContext(testInfo.testId, testInfo.retry);
    testInfo.annotations.push(...traceAnnotations(trace));

    await use({ ...extraHTTPHeaders, ...buildTraceHeaders(trace) });
  },

  featureFlagOverrides: [ALL_FEATURES_ENABLED, { option: true }],

  featureFlags: [
    async ({ page, featureFlagOverrides }, use) => {
      await stubFeatureFlags(page, featureFlagOverrides);
      await use();
    },
    { auto: true },
  ],

  headerSection: headerSectionFixture,
  footerSection: footerSectionFixture,
  supportModal: supportModalFixture,
});

export { expect };
