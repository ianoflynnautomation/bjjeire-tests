---
name: fixtures
description: Playwright fixture conventions for this acceptance suite. Feature specs import test from tests/features/<feature>/fixtures.ts, which extends @ui/fixtures with pageFixture and mockFixture. Cross-cutting UI specs import @ui/fixtures. API specs import @api/fixtures and pass Playwright's request fixture. Use when adding a page object, a route mock, a test option, or any other fixture. Do not use for locator strategy (selectors skill) or for how an API spec calls the feature client (api-testing skill).
author: Ian O Flynn
---

# Fixtures and Dependency Injection

Acceptance specs receive page objects, route mocks, and auth through Playwright fixtures. A spec never constructs a page object and never imports `test` from `@playwright/test`. The two setup projects (`tests/auth.setup.ts`, `tests/auth.api.setup.ts`) are the exception: they alias `test as setup` from `@playwright/test` because they run before the fixture chain.

The UI chain and the API chain stay separate. An API spec imports `@api/fixtures` and does not launch a browser. A UI spec imports its feature fixtures or `@ui/fixtures` and does not import `@api/fixtures`.

## Critical

- **ALWAYS** take a page object from a fixture. **NEVER** write `new GymsPage(page)` (or any other page class) in a spec.
- **ALWAYS** import `test` and `expect` from the same module: `./fixtures` in a feature spec, `@ui/fixtures` in a cross-cutting spec, `@api/fixtures` in an API spec.
- **Page objects for one feature** are registered in `tests/features/<feature>/fixtures.ts` with `pageFixture`. Do not add them to `src/ui/fixtures/base.ts`.
- **Route mocks** are registered with `mockFixture` in that same feature file. A mock runs only when the test calls it (`await mockGyms(body)`). Do not make it `auto`.
- **Options** use the tuple form `[default, { option: true }]`. `test.use` overrides an option. It does not override a plain fixture.
- **Auto fixtures** use `{ auto: true }` for a precondition every test in that chain needs. `featureFlags` is the one. Do not mark a page object auto.
- **Teardown is code after `await use(...)`.** It runs when the test fails. Add it only when the fixture holds something Playwright will not dispose with the page or the request context.
- **Do not add `mergeTests`, `fixtures/pom/test-options.ts`, or an `apiRequest` fixture.** This suite extends one base per chain.
- **Do not add a fixture that performs an API call.** The spec calls the feature client or `request.get`. See the `api-testing` skill, Phase 8.

## Fixture Architecture

```
src/ui/fixtures/base.ts                         ← CoreUiFixtures. Chrome, flags, trace headers
    ├── page-fixture.ts                         ← pageFixture(PageClass)
    ├── mock-fixture.ts                         ← mockFixture(mock)
    ├── failure.fixture.ts                      ← failureMockFixtures(route)
    └── feature-flags.fixture.ts                ← option + auto stub
tests/features/<feature>/fixtures.ts            ← core.extend: page object, mocks, <feature>TestConfig
src/api/fixtures/index.ts                       ← requestAuth option, bearer, trace headers
```

There is no shared registry. `tests/features/gyms/fixtures.ts` extends the core test. Removing the feature does not edit `base.ts`.

`pageFixture` constructs one instance per test. The class constructor takes `page` and nothing else:

```typescript
// src/ui/fixtures/page-fixture.ts
export function pageFixture<T>(pageObject: new (page: Page) => T) {
  return async ({ page }: { page: Page }, use: (instance: T) => Promise<void>): Promise<void> => {
    await use(new pageObject(page));
  };
}
```

`mockFixture` closes the mock over that test's `page` and yields a function:

```typescript
// src/ui/fixtures/mock-fixture.ts
export function mockFixture<A extends unknown[]>(mock: (page: Page, ...args: A) => Promise<void>) {
  return async ({ page }: { page: Page }, use: (fn: (...args: A) => Promise<void>) => Promise<void>): Promise<void> => {
    await use((...args: A) => mock(page, ...args));
  };
}
```

## Instructions

### Phase 1: Classify what you're adding

| Need | Home |
| --- | --- |
| Page object for one feature | `pageFixture(PageClass)` in `tests/features/<feature>/fixtures.ts` |
| Route mock for that feature (empty list, error, multi-page, snapshot body) | `mockFixture` in the same file. The mock function stays in `tests/features/<feature>/mocks.ts` and parses the body with the feature Zod schema |
| Network or HTTP failure for that feature's route | `...failureMockFixtures(ROUTE)` in the same file. The route is the only argument, so `failure.fixture.ts` stays feature-agnostic |
| One page object for a layout spec that is not part of the feature | `core.extend` in that spec file, as `tests/layout/routing.ui.acceptance.spec.ts` does. Do not import the feature's mocks |
| Flag, viewport, color scheme, or timezone for every spec in a feature | `<feature>TestConfig`, passed to `test.use` by each of that feature's UI specs |
| Flag set for one spec file | `test.use({ featureFlagOverrides: { ...ALL_FEATURES_ENABLED, Stores: false } })` in that file. See `tests/layout/feature-flags.ui.acceptance.spec.ts` |
| Cross-cutting UI precondition (chrome, flags, trace headers) | `CoreUiFixtures` in `src/ui/fixtures/base.ts` |
| API auth or request headers | `src/api/fixtures/index.ts`. Playwright's `request` fixture is the caller. There is no `apiRequest` fixture |
| One API call, or a list assertion | **No fixture.** Call `getGyms(request, schema, query)` or `request.get`, then pass the value to a helper. See the `api-testing` skill, Phase 8 |
| Pure function with no `page`, `request`, or lifecycle | A function under `src/ui/support/` or `src/api/support/`. Not a fixture |
| Timeouts, workers, projects, `grep` | `src/shared/config/playwright.ts` and the UI or API project config. Not a fixture |

If the need fits none of these rows, stop and ask. Do not invent a second registry.

`test.use` replaces the project value for that option. A spec that sets `colorScheme: 'light'` runs light in every project, including `a11y` and the dark snapshot project.

### Phase 2: Prerequisites (only for page object fixtures)

Before `pageFixture` wraps a class:

- The class was written after `npx playwright cli` exploration. See the `selectors` skill, Phase 1 and Phase 2.
- The constructor takes `page` and stores no other state. `pageFixture` types that constructor.
- Locators follow the `selectors` skill. List pages cover the feedback this app shows (search empty, unfiltered empty, error alert). See "Feedback & Validation Message Selectors" in that skill. Do not add a success toast for a write the suite does not perform.
- The class lives in `src/ui/pages/<feature>/`. A list page extends `ListPage`.

Registering a page object built from a guessed DOM skips the exploration. Stop and open the app first.

### Phase 3: Create or extend the fixture file

A feature already has `tests/features/<feature>/fixtures.ts`. Add the fixture there. Scaffold a missing feature with `/add-feature` rather than copying a file by hand. The template is `tests/features/_template/fixtures.ts`.

A new file under `src/ui/fixtures/` is only for a cross-cutting mechanism that every UI test shares, the way `failure.fixture.ts` and `feature-flags.fixture.ts` are shared. Name the type (`GymsUiFixtures`, `CoreUiFixtures`, `ApiOptions`).

```typescript
// tests/features/gyms/fixtures.ts
import { mockGyms, GYMS_ROUTE } from './mocks';
import { GymsPage } from '@ui/pages/gyms/gyms.page';
import { test as core } from '@ui/fixtures';
import { failureMockFixtures, type FailureMocks } from '@ui/fixtures/failure.fixture';
import { mockFixture } from '@ui/fixtures/mock-fixture';
import { pageFixture } from '@ui/fixtures/page-fixture';

export type GymsUiFixtures = FailureMocks & {
  gymsPage: GymsPage;
  mockGyms: (body: unknown) => Promise<void>;
};

export const test = core.extend<GymsUiFixtures>({
  gymsPage: pageFixture(GymsPage),
  mockGyms: mockFixture(mockGyms),
  ...failureMockFixtures(GYMS_ROUTE),
});

export const gymsTestConfig: Parameters<typeof test.use>[0] = {};

export { expect } from '@ui/fixtures';
```

A layout spec that needs one feature page object extends the core in that file. It does not grow `CoreUiFixtures` and it does not pull in the feature mocks:

```typescript
// tests/layout/routing.ui.acceptance.spec.ts
import { test as core, expect } from '@ui/fixtures';
import { pageFixture } from '@ui/fixtures/page-fixture';
import { EventsPage } from '@ui/pages/events/events.page';

const test = core.extend<{ eventsPage: EventsPage }>({
  eventsPage: pageFixture(EventsPage),
});
```

### Phase 4: Register the fixture type and implementation

Put the field on the feature type and the implementation on `core.extend`. Depend only on fixtures that test actually needs. Playwright runs a fixture when something requests it, so an unused `gymsPage` costs nothing. An `auto` fixture runs on every test in that chain.

Page object and mock:

```typescript
export const test = core.extend<GymsUiFixtures>({
  gymsPage: pageFixture(GymsPage),
  mockGyms: mockFixture(mockGyms),
});
```

The spec imports `test` from that file, calls `test.use(gymsTestConfig)`, and receives `gymsPage`:

```typescript
import { test, gymsTestConfig } from './fixtures';

test.use(gymsTestConfig);

test(
  'visitor should see the gym list when opening Gyms',
  { tag: ['@smoke', '@acceptance'] },
  async ({ gymsPage }) => {
    await gymsPage.goTo();
    await gymsPage.verifyIsLoaded();
  },
);
```

An option is overridable from `test.use`. A plain fixture is not. Flags are an option so one file can turn a feature off. The auto fixture reads that option and stubs the app before any navigation:

```typescript
// src/ui/fixtures/base.ts
featureFlagOverrides: [ALL_FEATURES_ENABLED, { option: true }],

featureFlags: [
  async ({ page, featureFlagOverrides }, use) => {
    await stubFeatureFlags(page, featureFlagOverrides);
    await use();
  },
  { auto: true },
],
```

When overriding a built-in fixture, depend on the current value and spread it. Replacing `extraHTTPHeaders` outright drops the Cloudflare headers the project already set:

```typescript
extraHTTPHeaders: async ({ extraHTTPHeaders }, use, testInfo) => {
  const trace = testTraceContext(testInfo.testId, testInfo.retry);
  testInfo.annotations.push(...traceAnnotations(trace));
  await use({ ...extraHTTPHeaders, ...buildTraceHeaders(trace) });
},
```

The API chain does the same and adds the bearer unless the file opts out:

```typescript
// src/api/fixtures/index.ts
requestAuth: ['default', { option: true }],

extraHTTPHeaders: async ({ extraHTTPHeaders, requestAuth }, use, testInfo) => {
  const trace = testTraceContext(testInfo.testId, testInfo.retry);
  testInfo.annotations.push(...traceAnnotations(trace));
  await use({
    ...extraHTTPHeaders,
    ...buildTraceHeaders(trace),
    ...(requestAuth === 'none' ? {} : await apiAuthHeaders()),
  });
},
```

`tests/api/authorization.api.acceptance.spec.ts` is the only file that sets `test.use({ requestAuth: 'none' })`.

Stay at test scope. A fixture that touches `page` cannot be `{ scope: 'worker' }`. This suite has no worker fixtures.

### Phase 5: (Only for new categories) Merge into `test-options.ts`

This repo has no `test-options.ts` and does not call `mergeTests`. The extend in Phase 4 is the registration. Consumers import that module's `test`.

- A page object or mock added in the feature's `fixtures.ts` is already visible to specs that import `./fixtures`. Do not register it again.
- A fixture every UI test must have goes on `CoreUiFixtures` in `src/ui/fixtures/base.ts`. Header, footer, support modal, and `featureFlags` are that set. A feature page object does not belong there.
- A fixture every API test must have goes on the extend in `src/api/fixtures/index.ts`. That is `requestAuth` and the `extraHTTPHeaders` override. Do not merge the UI test into the API test.

A new category that is neither chrome nor API auth is still a feature fixture, or a layout-spec `core.extend`. Stop if the category does not fit Phase 1.

### Phase 6: Handle teardown via the `use()` callback

Setup runs before `await use(...)`. The argument to `use` is what the test receives. Code after `use` is teardown and runs when the test fails.

```typescript
myFixture: async ({ page }, use) => {
  const resource = await createResource();
  await use(resource);
  await resource.cleanup();
},
```

Current fixtures pass `use` a page object, a function, or nothing, and they have no code after `use`. Playwright closes `page` and disposes `request` at the end of the test, which drops routes, init scripts, and headers. `mockFixture` does not unroute, because the page close does that.

Add teardown after `use` only for a resource the page close does not own: a file the fixture created, a process it started, or a listener registered outside the page. Do not add an empty cleanup to `pageFixture`.

Do not seed or delete directory rows in a fixture, `beforeAll`, or `afterAll`. The app seeder owns the data. `tests/features/<feature>/seeded.ts` names the rows a spec asserts.

## Built-in Fixtures

| Fixture | Source | Purpose |
| --- | --- | --- |
| `headerSection`, `footerSection`, `supportModal` | `src/ui/fixtures/base.ts` | Chrome page objects, via `pageFixture` |
| `featureFlagOverrides` | `base.ts` option | Defaults to `ALL_FEATURES_ENABLED`. Override with `test.use` |
| `featureFlags` | `base.ts`, `auto: true` | Writes `__BJJEIRE_TEST_FLAG_OVERRIDES__` before the app boots |
| `extraHTTPHeaders` (UI) | `base.ts` | Adds `traceparent` on top of the project headers |
| `gymsPage`, `eventsPage`, `competitionsPage`, `storesPage`, `aboutPage` | that feature's `fixtures.ts` | The feature page object |
| `mockGyms`, `mockBjjEvents`, and the other list mocks | that feature's `fixtures.ts` | Opt-in `route.fulfill`, schema-checked |
| `mockNetworkError`, `mockServerError`, `mockServerErrorOnce` | `failureMockFixtures(route)` | Opt-in failure for that feature's route |
| `request` | Playwright, headers from `@api/fixtures` | Passed into `getGyms` and the other clients |
| `requestAuth` | `@api/fixtures` option | `'default'` or `'none'` |

### `request` vs a helper fixture

API specs take `request` from the test argument and pass it to the feature client. A fixture that hid that call would also hide the schema the spec passes. Phase 8 of the `api-testing` skill is the decision. There is no create/delete fixture: the directory is read-only.

## See Also

- `api-testing` skill, Phase 3 and Phase 8 — `request` goes into the feature client. No fixture performs the call.
- `selectors` skill — explore the live app before writing the page object this fixture wraps.
- `.agents/skills/playwright-cli/SKILL.md` — `npx playwright cli` from the repo root.
- `enums` skill — constants the page object reads.
- `AGENTS.md` — slice layout, `gotoRoute` / `gotoAppShell`, and the rule that a feature is three directories.
