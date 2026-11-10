---
name: playwright-spec-practices
description: Project-agnostic best practices for Playwright spec files, drawn from large-scale engineering test cultures and from how coding agents are run at frontier labs. Covers the living spec as the contract between spec, test and agent (titles, oracle, AC coverage, lifecycle, drift checks), what belongs in a spec and what moves out (helpers, data, selectors, mocks), DAMP over DRY, no logic in tests, hermetic and isolated tests, API-driven setup, determinism (clock, timezone, network), parallelism, tagging and tiers, flaky-test policy, failure diagnostics, how to write and review agent-authored tests (red-before-green, independent oracle, tooling-enforced rules, separate reviewer), ownership, and a spec review checklist. Use when creating, splitting, restructuring, or reviewing a *.spec.ts file, when deciding where a helper, constant, or piece of setup should live, or when an agent is about to write or verify tests. For TypeScript coding rules see playwright-typescript-standards; for scenario wording see playwright-bdd.
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
8. **A test must fail when the behaviour is broken, and someone must have seen it
   fail.** Red before green: watch it fail against the missing or broken behaviour
   (or a mutant) before trusting the pass. A test that cannot fail is documentation
   at best and false confidence at worst.
9. **Expected values come from an independent oracle.** The spec, the seeded record,
   or a fixed mock body. Never a re-implementation of the formula the app uses; a
   mapper that copies the app's arithmetic passes with the app's bug.
10. **Rules that can be enforced by tooling are enforced by tooling.** Lint rules,
    pre-commit hooks and agent hooks block `waitForTimeout`, `test.only`, bare
    `page.goto`, `force: true` and friends. Prose is for judgement, not for rules a
    machine can check.

## The spec is the contract

Specs come before, or with, the tests. A living spec file per feature (Markdown in
the repo, beside the code, reviewed in the same pull request) is what a planner
writes to, a generator implements from, a reviewer checks against, and a healer
consults before deciding whether the app or the test is wrong.

- **Titles are the contract.** The spec's numbered scenario titles are the test
  titles, character for character. A title is listed only when its test exists; a
  planned block without a numbered title is work not yet done. That one rule makes
  "is this covered?" a text diff instead of an opinion.
- **Every scenario names four things**: the acceptance criterion it covers
  (`Covers: AC-…`, or `none` with the risk), the data it uses, whether it mocks and
  why, and its **oracle**. Writing the oracle down is what exposes a test that would
  re-derive the expected value from the app.
- **Steps and expected results, separately.** Follow the shape of Playwright's
  test-agent plans (a seed, numbered steps, bulleted expected results): each expected
  result is one observable outcome and becomes exactly one assertion, so a reviewer
  can count assertions against outcomes. Steps are declarative, Given/When/Then in
  domain language with no selectors, URLs, status codes or field names; a product
  owner approves the block and the generator turns each step into a `test.step` with
  the same wording.
- **Tests point back.** A generated test starts with `// spec:` and `// seed:`
  comments naming the plan and the seed it was built from, and the drift check
  verifies the reference.
- **Lifecycle is visible.** Planned, implemented, held for a product decision, or
  rejected with a reason. Rejections stop the next planner from proposing the same
  scenario; holds stop an agent from encoding a bug as expected behaviour.
- **Findings are evidence, not scenarios.** App bugs go to a report or an issue and
  are linked from the spec. A test never weakens its assertion to match a bug.
- **Drift is a build failure.** A deterministic check (titles in the spec versus
  `test(` titles in the slice) runs in CI or as a lint. An LLM review on top can
  judge wording and layer choice, but it must not be the only thing that notices a
  renamed test.
- **Cheapest layer per rule.** Record which layer owns each rule (unit, API, UI) so
  two layers do not both pay for it and no layer assumes another has it.

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
  The mapper encodes the _spec's_ rendering rule (format, label, link shape), never
  the app's calculation. If the spec says "price per day" and the app multiplies by
  the number of days, a mapper that also multiplies hides the bug; a literal from
  the seeded record would have caught it.

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
- **Measure before and after.** Reproduce under `--repeat-each` on one worker and on
  several; compare a passing and a failing trace; call it fixed only when the same
  run that failed now passes every time. "It passed once after the change" is not
  evidence.
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
- Keep the failure artefacts an agent can read without a browser: the aria snapshot
  Playwright writes on failure (`error-context.md`), the trace, the request log. A
  healer that can reproduce from those alone is a healer that can run in CI.

## Ownership and maintenance

- Every spec folder has an owner (CODEOWNERS); flaky or failing tests route to them.
- Specs change in the same pull request as the behaviour they cover.
- Keep spec files focused: one feature (or one cohesive area) per file; split a file
  when it passes a few hundred lines or mixes unrelated behaviours.
- When a behaviour is removed, delete its tests in the same change.
- Treat test code with production standards: reviewed, linted, type-checked, and
  refactored.

## Agent-authored tests

Coding agents write most new tests in a modern suite. The practices below are how
teams that run agents at scale keep that output trustworthy; they apply equally to a
human in a hurry.

**Give the agent a way to verify, then make it use it.**

- Write the test first and watch it fail (missing behaviour, a mutant, or a
  deliberately broken assertion), then make it pass. Tell the agent explicitly that
  the test must fail first and that it may not special-case the test to pass.
- Require proof of stability in the report: the exact command and the
  `--repeat-each` output, not "it passes".
- Separate writing from judging. The agent that wrote the test does not approve it;
  a reviewer with a fresh context (a different agent, or a human) reads the diff
  against the spec. Self-review in the same context inherits the same blind spots.
- Hooks over prompts. A pre-tool hook that denies `.skip(`, `.only(`,
  `waitForTimeout(` or edits to generated files holds under pressure; an instruction
  in a prompt does not. Lint on every edit, and feed the errors back.
- Keep instruction files short and single-sourced (one `AGENTS.md`, skills for the
  detail). Agents follow a 150-line file better than a 1500-line one, and two files
  that disagree are followed at random.

**What to look for when reviewing agent output** (the failure modes that recur):

| Failure mode               | What it looks like                                                                             | Check                                                            |
| -------------------------- | ---------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| Overclaiming title         | "visitor should see the gym's details" but Then only checks the card is visible                | Every noun in the title has an assertion                         |
| Cannot fail                | `expect(list).toBeVisible()` on a container that always renders; `toHaveCount` after no action | Break the behaviour (or run a mutant) and confirm the test fails |
| Oracle copied from the app | Expected value computed the same way the component computes it                                 | Expected values trace to the spec or the seeded record           |
| Mocking the happy path     | `route.fulfill` so the assertion is about the mock, not the product                            | Mocks only for states that cannot be seeded                      |
| Waiting on time            | `waitForTimeout`, `networkidle`, manual polling                                                | Web-first assertions on a user-visible condition                 |
| Quiet scope change         | A looser assertion, a changed title, or a skipped case to get to green                         | Diff the spec block against the test; titles identical           |
| Environment assumption     | Asserts a fixture is first on an unfiltered page; depends on the dataset's size                | Narrow first (search, filter, id), then assert                   |
| Layer duplication          | A UI test re-proving a validation rule the API spec owns                                       | One owner per rule, recorded in the spec                         |
| Fixing the symptom         | Raised timeout, added retry, `force: true`                                                     | Root cause named; the fix is a wait condition or data change     |

**Measure the suite, not just the run.** A green run says the tests passed; it does
not say they would notice a regression. Periodically corrupt real responses one field
at a time (a mutation audit) and triage every survivor into a gap, an equivalent, or
a rule owned elsewhere. The "tests that do not prove their title" list from such an
audit is the most valuable review input there is.

## Spec review checklist

- [ ] The title is in the living spec, character for character, with its AC-ID and oracle.
- [ ] Someone saw the test fail: against missing behaviour, a mutant, or a broken assertion.
- [ ] Expected values trace to the spec or the seeded record, not to the app's own calculation.
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
- [ ] If an agent wrote it: the report shows the failing-then-passing run and the
      `--repeat-each` output, and a different context reviewed the diff.
