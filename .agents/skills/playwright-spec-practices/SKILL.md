---
name: playwright-spec-practices
description: Project-agnostic best practices for Playwright spec files, drawn from large-scale engineering test cultures. Covers what belongs in a spec and what moves out (helpers, data, selectors, mocks), DAMP over DRY, no logic in tests, hermetic and isolated tests, API-driven setup, auth reuse, determinism (clock, timezone, network), parallelism, hooks, tagging and test tiers, flaky-test policy, failure diagnostics, ownership, and a spec review checklist. Use when creating, splitting, restructuring, or reviewing a *.spec.ts file, or when deciding where a helper, constant, or piece of setup should live. For TypeScript coding rules see playwright-typescript-standards; for scenario wording see playwright-bdd.
metadata:
  author: Ian O Flynn
---

# Playwright spec file best practices

A spec file is **documentation of behaviour that happens to execute**. A reader should
understand what the product does from the spec alone, without opening the helpers,
and a failure should point to a single broken behaviour.

These guidelines are general. A repository's own conventions (AGENTS.md, local
skills) win where they are more specific. Related skills: `playwright-typescript-standards`
(code-level rules) and `playwright-bdd` (titles and Given/When/Then wording).

## Critical rules

1. **Specs contain tests, not tooling.** Reusable functions, selectors, data builders,
   route mocks, and assertion helpers live outside spec files.
2. **Every test is hermetic and independent.** It owns its data, runs in any order, on
   any worker, alone or with the whole suite, and leaves nothing behind that changes
   another test's result.
3. **No logic in tests.** No `if`, `switch`, `try/catch`, or computed expectations in
   a test body. A test that branches tests nothing reliably.
4. **DAMP over DRY.** Prefer Descriptive And Meaningful Phrases: a little repetition
   in specs is fine if each test reads top-to-bottom on its own. Remove duplication
   by moving _mechanics_ into helpers, never by hiding the _scenario_.
5. **Test behaviours, not pages or methods.** One test per rule or outcome; name it
   after the behaviour (see `playwright-bdd`).
6. **Deterministic or deleted.** A test that passes or fails without a code change is
   a defect. Fix it, quarantine it with an owner and a deadline, or delete it.
7. **Set up through the fastest reliable channel.** Arrange via API, seeding, or
   storage state; drive the UI only for the behaviour under test.

## What lives where

| Belongs in the spec                                  | Moves out of the spec                                          |
| ---------------------------------------------------- | -------------------------------------------------------------- |
| `test.describe` / `test` blocks, titles, tags        | Page objects and component objects (`pages/`)                  |
| `test.step` phases (Given / When / Then)             | Locators and selector strings (page objects)                   |
| Calls to fixtures, page objects, API clients         | Data factories and faker usage (`testdata/`, `factories/`)     |
| The specific values that make this scenario distinct | Seeded fixture constants shared by several specs               |
| File-scoped `test.use({...})` overrides              | Route mocks and mock bodies (`mocks.ts`, JSON fixtures)        |
| Small, file-local constants that name test intent    | Assertion helpers used by more than one spec                   |
|                                                      | Waiting / retry / polling helpers (support layer)              |
|                                                      | Environment config, URLs, credentials (config + env)           |
|                                                      | Expected-value calculations (mappers, e.g. `cardFromDto(dto)`) |

Rules of thumb:

- **Used twice → extract it.** A helper copied into a second spec moves to the
  feature folder; used by a second feature, it moves to a shared support module.
- **Never export from a spec file**, and never import one spec from another. Spec
  files are leaves; Playwright may load them in any order and on any worker.
- **No top-level side effects** in spec files (network calls, file writes, `faker.seed`
  at module scope). Module code runs once per worker at collection time, not per test.
- **File-local constants are fine** when they name intent
  (`const otherCountyGym = SEEDED_GYM_LIFFEY;`). Anything computed belongs in a mapper
  or factory.
- **Expected values come from the same source of truth as the inputs.** Derive the
  expected card from the seeded record with a mapper rather than retyping strings.

Suggested layout (adapt names to the project):

```
tests/
  <feature>/
    <feature>.ui.spec.ts         # behaviours only
    <feature>.api.spec.ts
    fixtures.ts                  # extends the base test with this feature's objects
    mocks.ts                     # route mocks for hard-to-reproduce states
    testdata/                    # seeded constants, factories, JSON bodies
src/
  pages/<feature>/               # page objects, constants, card readers, mappers
  api/<feature>/                 # API clients, types, schemas
  support/                       # cross-feature helpers (waits, assertions, auth)
```

## DAMP specs: readable without opening helpers

```ts
// Too DRY: the scenario is hidden in a helper; a failure says nothing.
test('search works', async ({ page }) => {
  await runSearchScenario(page, 'gyms', 'partial');
});

// Too WET: mechanics leak into the spec.
test('visitor should find a gym by part of its name', async ({ page }) => {
  await page.goto('/gyms');
  await page.getByTestId('search-input').fill('Black');
  await expect(page.getByTestId('gyms-list-item')).toHaveCount(1);
});

// DAMP: the scenario is visible; the mechanics are not.
test('visitor should find a gym by part of its name', async ({ gymsPage }) => {
  await test.step('When a visitor opens Gyms', () => gymsPage.goTo());
  await test.step(`And the visitor searches for "${partialName}"`, () => gymsPage.searchFor(partialName));
  await test.step('Then only that gym is listed', async () => {
    await gymsPage.expectResultCount(1);
    await gymsPage.expectCardData(expectedCard);
  });
});
```

Do not create "scenario helpers" that run a whole test (`runSearchScenario`,
`doCheckoutFlow`). Extract steps, not stories.

## No logic in tests

- **No branching.** If the test needs `if`, it is two tests, or the precondition belongs
  in a `test.skip(condition, reason)` at the top.
- **No `try/catch`** around actions or assertions. Let Playwright report the failure
  with its trace.
- **No computed expectations** (`expect(total).toBe(price * qty * 1.23)`). Use literal
  expected values or a mapper shared with the input data.
- **Loops only to generate tests**, from a typed `readonly` table, with the case in the
  title. A loop inside one test hides which iteration failed; if one is unavoidable,
  wrap each iteration in a named `test.step`.

```ts
for (const { label, value } of invalidPageSizes) {
  test(`client should get a validation error when the page size is ${label}`, async ({ request }) => {
    const response = await request.get(listUrl({ pageSize: value }));
    await expectValidationProblem(response, 'pageSize');
  });
}
```

## Hermetic, isolated tests

- **Own your data.** Create it per test (factory + API) or read immutable seeded
  fixtures. Never depend on data created by another test or a previous run.
- **Unique names for anything you create** (`faker` + a unique suffix) so parallel
  workers and retries never collide.
- **Clean up in the fixture that created the data** (after `use()`), not in an
  `afterEach` in the spec. Cleanup must not fail the test it serves; log and continue.
- **Shared environments hold more than your fixtures.** Narrow the view (search,
  filter, direct URL) before asserting a specific item exists; never assume it is on
  page 1 of an unfiltered list.
- **Avoid `test.describe.serial`.** Serial chains hide dependencies and turn one
  failure into many. If steps really form one journey, make them one test with
  `test.step`s.
- **Do not test third parties.** Stub external payment, maps, email, and analytics at
  the network layer; cover the integration with a contract test instead.

## Fast, reliable setup

- **Authenticate once, reuse everywhere.** A setup project signs in and writes
  `storageState`; tests start authenticated. Only the login spec drives the login UI.
- **Arrange via API or seeding**, then verify through the UI. A test about cancelling
  an order should not create the order by clicking through checkout.
- **Prefer fixtures to hooks.** Fixtures are typed, lazy, composable, and torn down
  automatically. Use `beforeEach` only for a step every test in the file shares and
  that the reader must see (e.g. one `test.use` or a shared mock); never for setup
  some tests don't need.
- **Worker-scoped fixtures** for expensive, read-only resources (an API token, a
  seeded tenant). **Test-scoped** for anything mutable.
- **Pin feature flags and configuration** that the test assumes, instead of observing
  whatever the environment currently serves.

## Determinism

- **No sleeps.** Never `waitForTimeout`. Wait on a user-visible condition with
  web-first assertions; wait on network only when the response is the behaviour
  (`page.waitForResponse`).
- **Control time.** Use `page.clock` for time-dependent UI, and set `timezoneId` and
  `locale` in config so dates render the same on every machine.
- **Control randomness.** Unique generated data is fine; assertions must not depend on
  random values except to prove absence ("matches nothing").
- **Mock only hard-to-reproduce states** (empty, error, slow, pagination edge), and
  validate mock bodies against the real response schema so mocks cannot drift.
- **Stable visual snapshots.** Mask dynamic regions, disable animations, fix the
  viewport, and keep baselines per platform.

## Parallelism and speed

- Enable `fullyParallel` and design every test for it from day one.
- Keep individual tests short (seconds, not minutes). A long test is usually several
  behaviours or UI-driven setup.
- Shard in CI; keep worker count sized to what the system under test can serve, not to
  the CI machine's cores.
- Run the cheapest layer that proves the behaviour: unit < API < UI. A UI spec should
  not re-verify every validation rule the API spec already covers.
- Budget suite time (e.g. a CI SLA) and spend cross-browser and cross-device runs on a
  smoke subset rather than the full suite.

## Tags and test tiers

- Tag at `describe` level for feature and layer (`@checkout`, `@ui`, `@api`) and at
  test level for tier (`@smoke`, `@regression`).
- **Smoke** = a small set of critical user journeys that must pass on every deploy.
  Keep it small; a slow smoke tier stops being run.
- Select by tag with `--grep` / project `grep`; never by editing specs or using
  `test.only`.
- `test.only` and unconditional `test.skip` are blocked by lint and CI
  (`forbidOnly: !!process.env.CI`).

## Flaky tests

Large engineering organisations treat flakiness as a first-class defect, because a
suite people don't trust gets ignored.

- **Retries are a signal, not a fix.** Allow a small number of retries in CI and report
  "flaky" (passed on retry) as a distinct, tracked outcome.
- **Quarantine, don't ignore.** Tag a known-flaky test (e.g. `@quarantine`), exclude it
  from gating runs, open a ticket with an owner, and fix or delete it within a fixed
  window. Keep the quarantine list short and visible.
- **Fix the cause, not the timeout.** Raising a timeout or adding a retry around one
  step hides races. Find the missing wait condition or shared state.
- **Delete low-value tests.** A test that duplicates coverage at a cheaper layer, or
  that nobody can explain, costs more than it protects.

## Failure diagnostics

A failing test should be debuggable from the CI report alone.

- Config: `trace: 'on-first-retry'` (or `retain-on-failure`), `screenshot: 'only-on-failure'`,
  `video: 'retain-on-failure'` where affordable.
- `test.step` titles become the report outline; write them for the person reading a
  failure at 2 a.m.
- Add assertion messages where the subject isn't obvious:
  `await expect(rows, 'cancelled orders').toHaveCount(0)`.
- Attach useful context with `testInfo.attach` (generated data, request ids, seeds), not
  `console.log`.
- Propagate a correlation id (`traceparent` / request id header) so a failing test maps
  to backend logs.

## Ownership and maintenance

- Every spec folder has an owner (CODEOWNERS); flaky or failing tests route to them.
- Specs change in the same pull request as the behaviour they cover.
- Keep spec files focused: one feature (or one cohesive area) per file; split a file
  when it passes a few hundred lines or mixes unrelated behaviours.
- When a behaviour is removed, delete its tests in the same change.
- Treat test code with production standards: reviewed, linted, type-checked, and
  refactored.

## Spec review checklist

- [ ] The file only declares tests; no exported helpers, selectors, or factories.
- [ ] Reading the spec alone explains what each test proves (DAMP).
- [ ] No `if` / `try` / computed expectations in test bodies; loops only generate tests.
- [ ] Each test owns or selects its data, runs alone and in parallel, and cleans up via
      fixtures.
- [ ] Setup uses API, seeding, or storage state; the UI is driven only for the behaviour.
- [ ] No `waitForTimeout`, no fixed sleeps; time, timezone, and flags are controlled.
- [ ] Mocks exist only for hard-to-reproduce states and are schema-validated.
- [ ] Tags place the test in the right tier; no `test.only` / unconditional `test.skip`.
- [ ] Failure output (step titles, messages, attachments) identifies the broken behaviour.
- [ ] The behaviour isn't already covered at a cheaper layer.
