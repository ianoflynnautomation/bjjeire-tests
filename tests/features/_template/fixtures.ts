import { TemplatePage } from '@ui/pages/_template/_template.page';
import { test as core } from '@ui/fixtures';
import { pageFixture } from '@ui/fixtures/mock-fixture';

// A feature with route mocks also spreads `failureMockFixtures(<FEATURE>_ROUTE)`
// here — see tests/features/gyms/fixtures.ts.
export type TemplateUiFixtures = {
  templatePage: TemplatePage;
};

export const test = core.extend<TemplateUiFixtures>({
  templatePage: pageFixture(TemplatePage),
});

/**
 * Option values every template spec runs with — each of them calls
 * `test.use(templateTestConfig)`. Intentionally empty: the defaults suit template today.
 * Put anything the whole feature needs here (`viewport`, `colorScheme`,
 * `featureFlagOverrides`, `timezoneId`, …) and every template spec picks it up
 * without being edited. The type is derived from this feature's own `test`, so
 * it accepts the core options plus any option this file later declares.
 */
export const templateTestConfig: Parameters<typeof test.use>[0] = {};

export { expect } from '@ui/fixtures';
