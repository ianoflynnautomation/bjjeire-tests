import { AboutPage } from '@ui/pages/about/about.page';
import { test as core } from '@ui/fixtures';
import { pageFixture } from '@ui/fixtures/mock-fixture';

export type AboutUiFixtures = {
  aboutPage: AboutPage;
};

export const test = core.extend<AboutUiFixtures>({
  aboutPage: pageFixture(AboutPage),
});

/**
 * Option values every about spec runs with — each of them calls
 * `test.use(aboutTestConfig)`. Intentionally empty: the defaults suit about today.
 * Put anything the whole feature needs here (`viewport`, `colorScheme`,
 * `featureFlagOverrides`, `timezoneId`, …) and every about spec picks it up
 * without being edited. The type is derived from this feature's own `test`, so
 * it accepts the core options plus any option this file later declares.
 */
export const aboutTestConfig: Parameters<typeof test.use>[0] = {};

export { expect } from '@ui/fixtures';
