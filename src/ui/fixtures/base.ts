import { test as base, expect } from '@playwright/test';
import { readEnv } from '@shared/config/process-env';
import { buildTraceHeaders, testTraceContext, traceAnnotations } from '@shared/otel/trace-context';
import { annotateMutation, installResponseMutation } from '@ui/mocks/mutation.mock';
import { FooterSection } from '@ui/pages/sections/footer.section';
import { HeaderSection } from '@ui/pages/sections/header.section';
import { SupportModal } from '@ui/pages/support/bitcoin-support.modal';
import { ALL_FEATURES_ENABLED, stubFeatureFlags, type FeatureFlagOverrides } from './feature-flags.fixture';
import { pageFixture } from './page-fixture';

/**
 * Cross-cutting fixtures only: app chrome and the feature-flag option.
 * A feature's own page object and route mocks live in
 * `tests/features/<feature>/fixtures.ts`, which extends this module. Adding or
 * removing a feature leaves this file untouched.
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
  /**
   * Mutation-audit hook (`scripts/mutation-audit.mjs`): a `PW_MUTANT` spec such as
   * `bjjevent:rotate:county`, or `observe`. Unset in every normal run, which makes
   * `responseMutation` a no-op.
   */
  responseMutant: string | undefined;
  responseMutation: void;
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

  responseMutant: [readEnv('PW_MUTANT'), { option: true }],

  // Registered before any feature mock, so a spec's own `page.route` still wins.
  responseMutation: [
    async ({ page, responseMutant }, use, testInfo) => {
      if (responseMutant === undefined) {
        await use();
        return;
      }
      const report = await installResponseMutation(page, responseMutant);
      await use();
      annotateMutation(testInfo, report());
    },
    { auto: true },
  ],

  headerSection: pageFixture(HeaderSection),
  footerSection: pageFixture(FooterSection),
  supportModal: pageFixture(SupportModal),
});

export { expect };
